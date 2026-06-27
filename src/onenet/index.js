const mqtt = require('mqtt')
const { broadcast } = require('../ws')

// OneNET MQTT 直连：订阅设备数据
const ONENET_BROKER = 'mqtt://studio-mqtt.heclouds.com'
const PRODUCT_ID = '9H5ymnKKrW'
const DEVICE_ID = 'T1'
const ACCESS_KEY = 'version=2018-10-31&res=products%2F9H5ymnKKrW%2Fdevices%2FT1&et=2053320694&method=md5&sign=9ziux45mbJB1eiId0p%2B%2Bvg%3D%3D'

// 设备上报数据 topic
const PUB_TOPIC = `$sys/${PRODUCT_ID}/${DEVICE_ID}/thing/property/post`

function connectOneNET() {
  console.log('[OneNET] 连接 MQTT 订阅设备数据...')

  const client = mqtt.connect(ONENET_BROKER, {
    port: 1883,
    clientId: DEVICE_ID + '-backend-' + Math.random().toString(16).slice(2, 8),
    username: PRODUCT_ID,
    password: ACCESS_KEY,
    clean: true,
    reconnectPeriod: 10000,
    connectTimeout: 10000
  })

  client.on('connect', () => {
    console.log('[OneNET] MQTT 已连接')
    client.subscribe(PUB_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error('[OneNET] 订阅失败:', err.message)
      else console.log('[OneNET] 已订阅:', PUB_TOPIC)
    })
  })

  client.on('message', (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString())
      console.log('[OneNET] 收到设备上报:', JSON.stringify(msg).substring(0, 200))

      // OneNET 设备数据通常在 params 里
      const raw = (msg.params || msg.data || msg)
      const data = {
        soilMoisture: raw.soilMoisture || raw.soil_percent || 50,
        valveStatus: raw.valveStatus || raw.valve || 'off',
        mode: raw.mode || raw.current_mode || 'auto',
        threshold: raw.threshold || raw.humidity_threshold_pct || 35,
        deviceStatus: 'online',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
      }

      broadcast({ type: 'device_data', deviceType: 'irrigation', data })

      const { getPool } = require('../db')
      const pool = getPool()
      pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
        ['irrigation', JSON.stringify(data)])
    } catch (e) {
      console.error('[OneNET] 数据解析错误:', e.message)
    }
  })

  client.on('error', (err) => {
    console.error('[OneNET] MQTT错误:', err.message)
  })

  client.on('reconnect', () => {
    console.log('[OneNET] MQTT 重连...')
  })
}

module.exports = { connectOneNET }
