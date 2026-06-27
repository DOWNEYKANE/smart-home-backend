const http = require('http')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const API_KEY = '6f3840022ac3455fbcd2422be8248a27'
const DEVICE_ID = 'T1'

function connectOneNET() {
  console.log('[OneNET] 启动 HTTP API 轮询（每5秒）')

  function fetchData() {
    const options = {
      hostname: 'api.heclouds.com',
      path: '/devices/' + DEVICE_ID + '/datapoints?limit=1',
      method: 'GET',
      headers: {
        'api-key': API_KEY
      },
      timeout: 8000
    }

    const req = http.get(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        console.log('[OneNET] HTTP', res.statusCode, '- body前100字:', body.substring(0, 100))
        try {
          const result = JSON.parse(body)
          if (result.errno === 0 && result.data) {
            const data = { deviceStatus: 'online', timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) }
            if (result.data.datastreams) {
              result.data.datastreams.forEach(ds => {
                const pt = ds.datapoints?.[0]
                if (pt && pt.value !== undefined) data[ds.id] = pt.value
              })
            } else if (result.data.current_value !== undefined) {
              data.value = result.data.current_value
            }
            if (Object.keys(data).length > 1) {
              console.log('[OneNET] 收到设备数据:', JSON.stringify(data))
              broadcast({ type: 'device_data', deviceType: 'irrigation', data })
              const pool = getPool()
              pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)', ['irrigation', JSON.stringify(data)])
            }
          }
        } catch (e) {
          console.error('[OneNET] JSON解析失败:', e.message)
        }
      })
    })

    req.on('error', (e) => console.error('[OneNET] 错误:', e.message))
    req.on('timeout', () => { req.destroy(); console.error('[OneNET] 超时') })
    setTimeout(() => { req.destroy() }, 8000)
  }

  fetchData()
  setInterval(fetchData, 5000)
}

module.exports = { connectOneNET }
