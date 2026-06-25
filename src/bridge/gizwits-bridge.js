/**
 * 机智云桥接服务
 *
 * 通过 WebSocket 连接机智云平台，实时接收设备数据，
 * 转换格式后发布到用户的 MQTT Broker 和 HTTP 接口。
 *
 * 数据流:
 *   STM32 → ESP8266(GAgent) → 机智云云平台 → [本桥接服务] → MQTT Broker / HTTP → 后端 DB
 */

const WebSocket = require('ws')
const mqtt = require('mqtt')
const { anonymousLogin, login, WS_URL } = require('./gizwits-api')

// 重连间隔（毫秒）
const RECONNECT_INTERVAL = 5000
// 心跳间隔（毫秒）
const HEARTBEAT_INTERVAL = 60000
// 数据上报最小间隔（毫秒），防止过于频繁
const REPORT_INTERVAL = 3000

class GizwitsBridge {
  constructor(config) {
    this.productKey = config.productKey
    this.productSecret = config.productSecret
    this.deviceDid = config.deviceDid       // 设备 DID（可选，不填则订阅所有绑定设备）
    this.username = config.username         // 机智云账号（可选，推荐填写）
    this.password = config.password         // 机智云密码（可选，推荐填写）
    this.mqttUrl = config.mqttUrl           // mqtt://host:port
    this.httpUrl = config.httpUrl           // http://host:port/api/device/data

    this.token = null
    this.ws = null
    this.mqttClient = null
    this.lastReportTime = 0
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.isRunning = false
  }

  /**
   * 启动桥接服务
   */
  async start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('[Bridge] 机智云桥接服务启动中...')

    try {
      // 1. 匿名登录获取 token
      await this._login()
      // 2. 连接 MQTT Broker
      this._connectMQTT()
      // 3. 连接机智云 WebSocket
      this._connectWebSocket()
    } catch (e) {
      console.error('[Bridge] 启动失败:', e.message)
      this._scheduleReconnect()
    }
  }

  /**
   * 停止桥接服务
   */
  stop() {
    this.isRunning = false
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) { this.ws.close(); this.ws = null }
    if (this.mqttClient) { this.mqttClient.end(); this.mqttClient = null }
    console.log('[Bridge] 桥接服务已停止')
  }

  /**
   * 登录机智云（优先用账号密码，失败则匿名登录）
   */
  async _login() {
    // 优先使用账号密码登录（更稳定）
    if (this.username && this.password) {
      console.log('[Bridge] 使用账号密码登录机智云...')
      try {
        const result = await login(this.username, this.password, this.productKey)
        this.token = result.token
        console.log(`[Bridge] 账号登录成功, uid: ${result.uid}`)
        return
      } catch (e) {
        console.error('[Bridge] 账号登录失败，尝试匿名登录:', e.message)
      }
    }

    // 匿名登录
    console.log('[Bridge] 使用匿名登录机智云...')
    const result = await anonymousLogin(this.productKey)
    this.token = result.token
    console.log(`[Bridge] 匿名登录成功, uid: ${result.uid}`)
  }

  /**
   * 连接 MQTT Broker
   */
  _connectMQTT() {
    if (!this.mqttUrl) {
      console.log('[Bridge] 未配置 MQTT_URL，跳过 MQTT 连接')
      return
    }

    console.log(`[Bridge] 连接 MQTT Broker: ${this.mqttUrl}`)
    this.mqttClient = mqtt.connect(this.mqttUrl, {
      clientId: `gizwits-bridge-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000
    })

    this.mqttClient.on('connect', () => {
      console.log('[Bridge] MQTT 已连接')
    })

    this.mqttClient.on('error', (err) => {
      console.error('[Bridge] MQTT 错误:', err.message)
    })
  }

  /**
   * 连接机智云 WebSocket
   */
  _connectWebSocket() {
    console.log('[Bridge] 连接机智云 WebSocket...')

    const ws = new WebSocket(WS_URL, {
      headers: {
        'X-Gizwits-Application-Id': this.productKey,
        'X-Gizwits-User-Token': this.token
      }
    })

    ws.on('open', () => {
      console.log('[Bridge] WebSocket 已连接')
      this._startHeartbeat()
      this._subscribeDevice()
    })

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        this._handleMessage(msg)
      } catch (e) {
        console.error('[Bridge] 消息解析失败:', e.message)
      }
    })

    ws.on('close', () => {
      console.log('[Bridge] WebSocket 已断开')
      this._stopHeartbeat()
      if (this.isRunning) this._scheduleReconnect()
    })

    ws.on('error', (err) => {
      console.error('[Bridge] WebSocket 错误:', err.message)
    })

    this.ws = ws
  }

  /**
   * 订阅设备数据
   */
  _subscribeDevice() {
    const subscribeMsg = {
      cmd: 'subscribe_req',
      data: []
    }

    if (this.deviceDid) {
      // 订阅指定设备
      subscribeMsg.data.push({ did: this.deviceDid, binary: false })
    } else {
      // 订阅所有绑定设备（需要先获取设备列表）
      subscribeMsg.data.push({ product_key: this.productKey, binary: false })
    }

    this._send(subscribeMsg)
    console.log('[Bridge] 已发送订阅请求:', JSON.stringify(subscribeMsg))
  }

  /**
   * 处理机智云推送消息
   */
  _handleMessage(msg) {
    // 心跳响应
    if (msg.cmd === 'pong') return

    // 订阅响应
    if (msg.cmd === 'subscribe_res') {
      console.log('[Bridge] 订阅响应:', JSON.stringify(msg))
      return
    }

    // 设备数据推送
    if (msg.cmd === 'push' && msg.data) {
      const now = Date.now()
      // 限流：避免过于频繁地转发
      if (now - this.lastReportTime < REPORT_INTERVAL) return
      this.lastReportTime = now

      const attrs = msg.data.attrs || msg.data
      const did = msg.data.did || 'unknown'

      console.log(`[Bridge] 收到设备数据 (DID: ${did}):`, JSON.stringify(attrs))

      // 转换数据格式并转发
      const envData = this._convertData(attrs, did)
      if (envData) {
        this._forwardData(envData)
      }
    }
  }

  /**
   * 将机智云数据格式转换为后端环境数据格式
   *
   * 机智云数据点（来自 gizwits_protocol.h）:
   *   valueTemp      - 温度 (uint32, 0~100)
   *   valueHum       - 湿度 (uint32, 0~100)
   *   valueMQ2_Value - 烟雾 (uint32, 0~2000)
   *   relay_switch   - 继电器 (bool)
   *
   * 后端格式:
   *   { temperature, humidity, smoke, relayStatus, deviceStatus, timestamp }
   */
  _convertData(attrs, did) {
    // 至少要有温度或湿度数据
    if (attrs.valueTemp === undefined && attrs.valueHum === undefined) {
      return null
    }

    return {
      temperature: attrs.valueTemp !== undefined ? Number(attrs.valueTemp) : null,
      humidity: attrs.valueHum !== undefined ? Number(attrs.valueHum) : null,
      smoke: attrs.valueMQ2_Value !== undefined ? Number(attrs.valueMQ2_Value) : null,
      relayStatus: attrs.relay_switch === 1 || attrs.relay_switch === true ? 'on' : 'off',
      deviceStatus: 'online',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      source: 'gizwits',
      did: did
    }
  }

  /**
   * 转发数据到 MQTT 和 HTTP
   */
  async _forwardData(data) {
    // 发布到 MQTT
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(
        'smart-home/environment/status',
        JSON.stringify(data),
        { qos: 1 },
        (err) => {
          if (err) console.error('[Bridge] MQTT 发布失败:', err.message)
          else console.log('[Bridge] → MQTT smart-home/environment/status')
        }
      )
    }

    // 发送到 HTTP 接口
    if (this.httpUrl) {
      try {
        const res = await fetch(this.httpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceType: 'environment', ...data })
        })
        if (res.ok) {
          console.log('[Bridge] → HTTP /api/device/data 成功')
        } else {
          console.error('[Bridge] → HTTP 失败:', res.status)
        }
      } catch (e) {
        console.error('[Bridge] → HTTP 请求失败:', e.message)
      }
    }
  }

  /**
   * 发送 WebSocket 消息
   */
  _send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this._send({ cmd: 'ping' })
    }, HEARTBEAT_INTERVAL)
  }

  /**
   * 停止心跳
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 计划重连
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) return
    console.log(`[Bridge] ${RECONNECT_INTERVAL / 1000}秒后重连...`)
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      if (!this.isRunning) return
      try {
        await this._login()
        this._connectWebSocket()
      } catch (e) {
        console.error('[Bridge] 重连失败:', e.message)
        this._scheduleReconnect()
      }
    }, RECONNECT_INTERVAL)
  }
}

/**
 * 启动桥接服务（工厂函数）
 */
function startGizwitsBridge(config) {
  const bridge = new GizwitsBridge(config)
  bridge.start()
  return bridge
}

module.exports = { GizwitsBridge, startGizwitsBridge }
