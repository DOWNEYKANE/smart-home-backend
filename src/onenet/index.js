const https = require('https')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const API_KEY = '6f3840022ac3455fbcd2422be8248a27'
const DEVICE_ID = 'T1'
const PRODUCT_ID = '9H5ymnKKrW'

function connectOneNET() {
  console.log('[OneNET] 启动 HTTP API 轮询（每5秒）')

  setInterval(() => {
    // OneNET 获取设备最新数据
    const options = {
      hostname: 'api.heclouds.com',
      path: '/v1/devices/' + DEVICE_ID + '/datastreams',
      method: 'GET',
      headers: {
        'api-key': API_KEY
      },
      timeout: 5000
    }

    const req = https.get(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.errno !== 0 || !result.data) {
            return
          }

          // 解析所有数据流
          const data = {}
          result.data.forEach(ds => {
            if (ds.current_value !== undefined) {
              data[ds.id] = ds.current_value
            }
          })

          // 映射为浇灌字段
          const irrigation = {
            soilMoisture: data.soil_percent || data.soilMoisture || data.soil_humi || 0,
            valveStatus: data.valveStatus || data.valve || data.pump_state || 'off',
            mode: data.mode || data.current_mode || 'auto',
            threshold: data.threshold || data.humidity_threshold_pct || 35,
            deviceStatus: 'online',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          }

          if (Object.keys(data).length > 0) {
            console.log('[OneNET] 收到设备数据')
            broadcast({ type: 'device_data', deviceType: 'irrigation', data: irrigation })
            const pool = getPool()
            pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
              ['irrigation', JSON.stringify(irrigation)])
          }
        } catch (e) {
          // 忽略解析错误
        }
      })
    })

    req.on('error', () => {})
    req.on('timeout', () => { req.destroy() })
  }, 5000)
}

module.exports = { connectOneNET }
