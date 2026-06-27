const http = require('http')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const DEVICE_ID = 'T1'
const API_KEY = '6f3840022ac3455fbcd2422be8248a27'

function connectOneNET() {
  console.log('[OneNET] 启动轮询（每5秒）')

  function fetchData() {
    const options = {
      hostname: 'api.heclouds.com',
      path: '/devices/' + DEVICE_ID + '/datastreams',
      method: 'GET',
      headers: { 'api-key': API_KEY },
      timeout: 8000
    }

    const req = http.get(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log('[OneNET] HTTP', res.statusCode, body.substring(0, 200))
        try {
          const result = JSON.parse(body)
          if (result.errno === 0 && result.data) {
            const data = { soilMoisture: 50, valveStatus: 'off', mode: 'auto', threshold: 35, deviceStatus: 'online', timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) }
            result.data.forEach(ds => {
              if (ds.current_value !== undefined) {
                const v = ds.current_value
                if (ds.id === 'soil_percent' || ds.id === 'soilMoisture') data.soilMoisture = v
                if (ds.id === 'valve' || ds.id === 'valveStatus') data.valveStatus = v
                if (ds.id === 'mode') data.mode = v
                if (ds.id === 'threshold') data.threshold = v
              }
            })
            console.log('[OneNET] 收到设备数据')
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
