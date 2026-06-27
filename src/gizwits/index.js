// 机智云 Open API：拉取温湿度组设备数据
const https = require('https')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const APP_ID = '027108de4a1044f9b102b3f24028ca6b'
const APP_SECRET = '1289f45cc8ee42a6899015b6d6a485c3'
const PRODUCT_KEY = '027108de4a1044f9b102b3f24028ca6b'
const DEVICE_MAC = 'ec64c9da46d3'

let accessToken = ''

// 获取机智云 API Token
function getToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ appid: APP_ID, secret: APP_SECRET })

    const options = {
      hostname: 'openapi.gizwits.com',
      path: '/app/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gizwits-Application-Id': APP_ID,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => {
        try {
          const r = JSON.parse(body)
          if (r.token) {
            console.log('[Gizwits] Token 获取成功')
            resolve(r.token)
          } else {
            reject(new Error('无token: ' + body.substring(0, 100)))
          }
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    setTimeout(() => { req.destroy() }, 10000)
    req.write(postData)
    req.end()
  })
}

// 获取设备最新数据
function fetchDeviceData() {
  if (!accessToken) return

  const options = {
    hostname: 'api.gizwits.com',
    path: '/app/devdata/' + DEVICE_MAC + '/latest',
    method: 'GET',
    headers: {
      'X-Gizwits-Application-Id': APP_ID,
      'X-Gizwits-User-token': accessToken
    },
    timeout: 8000
  }

  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', c => body += c)
    res.on('end', () => {
      try {
        const r = JSON.parse(body)
        if (r.attr) {
          // 机智云属性映射
          const data = {
            temperature: r.attr.temperature || r.attr.Temperature || 0,
            humidity: r.attr.humidity || r.attr.Humidity || 0,
            smoke: r.attr.smoke || r.attr.Smoke || 0,
            relayStatus: r.attr.relay_switch ? 'on' : 'off',
            deviceStatus: r.is_online ? 'online' : 'offline',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          }

          console.log('[Gizwits] 收到环境数据:', JSON.stringify(data))

          broadcast({ type: 'device_data', deviceType: 'environment', data })

          const pool = getPool()
          pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
            ['environment', JSON.stringify(data)])
        }
      } catch (e) {
        console.error('[Gizwits] 解析失败:', e.message)
      }
    })
  })

  req.on('error', (e) => console.error('[Gizwits] 请求错误:', e.message))
  req.on('timeout', () => req.destroy())
  setTimeout(() => req.destroy(), 8000)
}

async function connectGizwits() {
  try {
    accessToken = await getToken()
    console.log('[Gizwits] 启动 API 轮询（每5秒）')
    // 每12小时刷新 Token
    setInterval(async () => { accessToken = await getToken() }, 12 * 60 * 60 * 1000)
    setInterval(fetchDeviceData, 5000)
  } catch (e) {
    console.error('[Gizwits] 初始化失败:', e.message)
    // 30秒后重试
    setTimeout(connectGizwits, 30000)
  }
}

module.exports = { connectGizwits }
