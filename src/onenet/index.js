const mqtt = require('mqtt')
const { broadcast } = require('../ws')

// 浇灌小组 OneNET 设备信息（从 wifi.h 提取）
const ONENET_BROKER = 'mqtt://studio-mqtt.heclouds.com'
const ONENET_PORT = 1883
const PRODUCT_ID = '9H5ymnKKrW'
const DEVICE_ID = 'T1'
const ACCESS_KEY = '6f3840022ac3455fbcd2422be8248a27'

// 设备数据上报 topic
const PUB_TOPIC = `$sys/${PRODUCT_ID}/${DEVICE_ID}/thing/property/post`

function connectOneNET() {
  const client = mqtt.connect(ONENET_BROKER, {
    port: ONENET_PORT,
    clientId: `smart-home-onenet-${Math.random().toString(16).slice(2, 8)}`,
    username: PRODUCT_ID,
    password: ACCESS_KEY,
    clean: true,
    reconnectPeriod: 10000
  })

  client.on('connect', () => {
    console.log('[OneNET] 已连接到 OneNET MQTT')
    client.subscribe(PUB_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error('[OneNET] 订阅失败:', err)
      else console.log('[OneNET] 已订阅:', PUB_TOPIC)
    })
  })

  client.on('message', (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString())
      console.log('[OneNET] 收到设备数据:', JSON.stringify(msg))

      // OneNET 数据格式：{ id, params: { soilMoisture: { value: 50 }, ... } }
      let data = {}
      if (msg.params) {
        for (const [key, val] of Object.entries(msg.params)) {
          data[key] = val.value !== undefined ? val.value : val
        }
      } else if (msg.data) {
        data = msg.data
      }

      // 补充字段
      data.deviceStatus = data.deviceStatus || 'online'
      data.timestamp = data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19)

      // 推送到前端
      broadcast({ type: 'device_data', deviceType: 'irrigation', data })

      // 存入数据库
      const { getPool } = require('../db')
      const pool = getPool()
      pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
        ['irrigation', JSON.stringify(data)])

    } catch (e) {
      console.error('[OneNET] 数据处理失败:', e.message)
    }
  })

  client.on('error', (err) => {
    console.error('[OneNET] 连接错误:', err.message)
  })

  client.on('reconnect', () => {
    console.log('[OneNET] 重连中...')
  })

  return client
}

module.exports = { connectOneNET }
