const https = require('https')
const { getPool } = require('../db')
const { broadcast } = require('../ws')

const APP_ID = 'fb80d0c28fb54881a6ac6a3005393b04'
const APP_SECRET = '1289f45cc8ee42a6899015b6d6a485c3'
const PRODUCT_KEY = 'a23145de965a42b4b359b5e55b4a7e0c'
const PRODUCT_SECRET = '027108de4a1044f9b102b3f24028ca6b'
const DEVICE_MAC = 'ec64c9da46d3'
const USERNAME = '1299581772@qq.com'
const PASSWORD = '18813423580LUODI'

let accessToken = ''

function doLogin(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.gizwits.com',
      path: '/app/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 10000
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const r = JSON.parse(data)
          if (r.token) { resolve(r.token) }
          else { reject(new Error(JSON.stringify(r))) }
        } catch (e) { reject(new Error(data.substring(0, 100))) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('超时')) })
    req.write(body)
    req.end()
  })
}

async function getToken() {
  try { return await doLogin(JSON.stringify({ username: USERNAME, password: PASSWORD })) } catch (e1) {}
  try { return await doLogin(JSON.stringify({ appid: APP_ID, secret: APP_SECRET })) } catch (e2) {}
  return await doLogin(JSON.stringify({ product_key: PRODUCT_KEY, product_secret: PRODUCT_SECRET }))
}

function fetchDeviceData() {
  if (!accessToken) return
  const options = {
    hostname: 'api.gizwits.com',
    path: '/app/devices/' + DEVICE_MAC,
    method: 'GET',
    headers: { 'X-Gizwits-Application-Id': APP_ID, 'X-Gizwits-User-token': accessToken },
    timeout: 8000
  }
  const req = https.request(options, (res) => {
    let data = ''
    res.on('data', c => data += c)
    res.on('end', () => {
      try {
        const r = JSON.parse(data)
        const env = {
          temperature: (r.attr && r.attr.temperature) || 0,
          humidity: (r.attr && r.attr.humidity) || 0,
          smoke: (r.attr && r.attr.smoke) || 0,
          relayStatus: (r.attr && r.attr.relay_switch) ? 'on' : 'off',
          deviceStatus: r.is_online ? 'online' : 'offline',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
        }
        if (env.temperature || env.humidity) {
          console.log('[Gizwits] 收到环境数据:', JSON.stringify(env))
          broadcast({ type: 'device_data', deviceType: 'environment', data: env })
          const pool = getPool()
          pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)', ['environment', JSON.stringify(env)])
        }
      } catch (e) {}
    })
  })
  req.on('error', () => {})
  req.on('timeout', () => req.destroy())
}

async function connectGizwits() {
  try {
    accessToken = await getToken()
    console.log('[Gizwits] Token 获取成功，启动轮询')
    setInterval(async () => { accessToken = await getToken() }, 11 * 60 * 60 * 1000)
    setInterval(fetchDeviceData, 5000)
    fetchDeviceData()
  } catch (e) {
    console.error('[Gizwits] 登录全部失败:', e.message)
    setTimeout(connectGizwits, 30000)
  }
}

module.exports = { connectGizwits }
