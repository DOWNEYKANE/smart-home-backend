const http = require('http')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const PRODUCT_ID = '9H5ymnKKrW'
const DEVICE_ID = 'T1'
const ACCESS_KEY = 'version=2018-10-31&res=products%2F9H5ymnKKrW%2Fdevices%2FT1&et=2053320694&method=md5&sign=9ziux45mbJB1eiId0p%2B%2Bvg%3D%3D'

function connectOneNET() {
  console.log('[OneNET] 启动 OneNET Studio API 轮询（每5秒）')

  function fetchData() {
    // OneNET Studio 设备属性查询接口
    const path = '/device/thing/property/query?product_id=' + PRODUCT_ID + '&device_name=' + DEVICE_ID
    const options = {
      hostname: 'iot-api.heclouds.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': ACCESS_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    }

    const req = http.get(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log('[OneNET] HTTP', res.statusCode, body.substring(0, 150))
        try {
          const result = JSON.parse(body)
          if (result.code === 0 && result.data) {
            const d = result.data
            const data = {
              soilMoisture: d.soilMoisture || d.soil_percent || d.soil_humi || 50,
              valveStatus: d.valveStatus || d.valve || d.pump_state || 'off',
              mode: d.mode || d.current_mode || 'auto',
              threshold: d.threshold || d.humidity_threshold_pct || 35,
              deviceStatus: 'online',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
            console.log('[OneNET] 收到设备数据:', JSON.stringify(data))
            broadcast({ type: 'device_data', deviceType: 'irrigation', data })
            const pool = getPool()
            pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)', ['irrigation', JSON.stringify(data)])
          }
        } catch (e) {}
      })
    })

    req.on('error', () => {})
    req.on('timeout', () => { req.destroy() })
    setTimeout(() => { req.destroy() }, 8000)
  }

  fetchData()
  setInterval(fetchData, 5000)
}

module.exports = { connectOneNET }
