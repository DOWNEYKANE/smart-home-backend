const https = require('https')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const API_KEY = '6f3840022ac3455fbcd2422be8248a27'
const DEVICE_ID = 'T1'

// 每 3 秒请求一次 OneNET REST API 获取设备最新数据
function connectOneNET() {
  console.log('[OneNET] 启动 HTTP API 轮询（每3秒）')

  setInterval(() => {
    const url = `https://api.heclouds.com/devices/${DEVICE_ID}/datapoints?limit=1`

    const options = {
      hostname: 'api.heclouds.com',
      path: `/devices/${DEVICE_ID}/datapoints?limit=1`,
      method: 'GET',
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }

    const req = https.get(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.errno !== 0 || !result.data) return

          // 解析 OneNET 数据点
          const data = {
            deviceStatus: 'online',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          }

          result.data.datastreams.forEach(ds => {
            const value = ds.datapoints[0]?.value
            if (value !== undefined) {
              data[ds.id] = value
            }
          })

          if (data.soilMoisture !== undefined || data.soil_percent !== undefined) {
            // 标准化字段名
            if (data.soil_percent !== undefined) data.soilMoisture = data.soil_percent
            if (!data.valveStatus) data.valveStatus = 'off'
            if (!data.mode) data.mode = 'auto'
            if (!data.threshold) data.threshold = 35

            console.log('[OneNET] 收到设备数据:', JSON.stringify(data))

            broadcast({ type: 'device_data', deviceType: 'irrigation', data })

            const pool = getPool()
            pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
              ['irrigation', JSON.stringify(data)])
          }
        } catch (e) {
          console.error('[OneNET] 解析失败:', e.message)
        }
      })
    })

    req.on('error', (e) => {
      console.error('[OneNET] 请求失败:', e.message)
    })

    req.on('timeout', () => {
      req.destroy()
    })
  }, 3000)
}

module.exports = { connectOneNET }
