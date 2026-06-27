const http = require('http')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const PRODUCT_ID = '9H5ymnKKrW'
const DEVICE_ID = 'T1'
const ACCESS_KEY = 'version=2018-10-31&res=products%2F9H5ymnKKrW%2Fdevices%2FT1&et=2053320694&method=md5&sign=9ziux45mbJB1eiId0p%2B%2Bvg%3D%3D'

function connectOneNET() {
  console.log('[OneNET] 启动 OneNET Studio API 轮询（每5秒）')

  function fetchData() {
    const postData = JSON.stringify({ product_id: PRODUCT_ID, device_name: DEVICE_ID })

    const options = {
      hostname: 'iot-api.heclouds.com',
      path: '/thing/property/query',
      method: 'POST',
      headers: {
        'Authorization': ACCESS_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log('[OneNET] HTTP', res.statusCode, body.substring(0, 200))
        try {
          const result = JSON.parse(body)
          if ((result.code === 0 || result.errno === 0) && result.data) {
            const d = result.data
            const input = {}
            // 遍历返回的属性列表
            if (Array.isArray(d)) {
              d.forEach(item => { input[item.id || item.key] = item.value })
            } else {
              Object.assign(input, d)
            }
            const output = {
              soilMoisture: input.soilMoisture || input.soil_percent || input.soil_humi || 50,
              valveStatus: input.valveStatus || input.valve || input.pump_state || 'off',
              mode: input.mode || input.current_mode || 'auto',
              threshold: input.threshold || input.humidity_threshold_pct || 35,
              deviceStatus: 'online',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
            console.log('[OneNET] 收到设备数据:', JSON.stringify(output))
            broadcast({ type: 'device_data', deviceType: 'irrigation', data: output })
            const pool = getPool()
            pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)', ['irrigation', JSON.stringify(output)])
          }
        } catch (e) {}
      })
    })

    req.on('error', () => {})
    req.on('timeout', () => { req.destroy() })
    setTimeout(() => { req.destroy() }, 8000)
    req.write(postData)
    req.end()
  }

  fetchData()
  setInterval(fetchData, 5000)
}

module.exports = { connectOneNET }
