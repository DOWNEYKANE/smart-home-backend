const mqtt = require('mqtt')
const config = require('../config')
const { saveDeviceData } = require('./handler')

let client = null

function connectMQTT() {
  const brokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`

  client = mqtt.connect(brokerUrl, {
    clientId: `smart-home-backend-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000
  })

  client.on('connect', () => {
    console.log('[MQTT] 已连接 Broker:', brokerUrl)
    // 订阅所有设备状态主题
    client.subscribe('smart-home/+/status', { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] 订阅失败:', err)
      else console.log('[MQTT] 已订阅 smart-home/+/status')
    })
    // 订阅设备事件
    client.subscribe('smart-home/+/event', { qos: 1 })
  })

  client.on('message', async (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString())
      console.log(`[MQTT] 收到消息 ${topic}:`, JSON.stringify(msg))

      // 从主题提取设备类型: smart-home/environment/status → environment
      const parts = topic.split('/')
      const deviceType = parts[1]

      await saveDeviceData(deviceType, msg)
    } catch (e) {
      console.error('[MQTT] 消息处理错误:', e.message)
    }
  })

  client.on('error', (err) => {
    console.error('[MQTT] 错误:', err.message)
  })

  client.on('reconnect', () => {
    console.log('[MQTT] 重连中...')
  })

  return client
}

function publishCommand(deviceType, command) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      return reject(new Error('MQTT 未连接'))
    }
    const topic = `smart-home/${deviceType}/command`
    client.publish(topic, JSON.stringify(command), { qos: 1 }, (err) => {
      if (err) reject(err)
      else resolve(true)
    })
    console.log(`[MQTT] 下发指令 ${topic}:`, JSON.stringify(command))
  })
}

function getClient() {
  return client
}

module.exports = { connectMQTT, publishCommand, getClient }
