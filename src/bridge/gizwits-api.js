/**
 * 机智云 Open API 封装
 * 文档: https://docs.gizwits.com/en-us/Cloud/OpenAPI.html
 */

const API_BASE = 'https://api.gizwits.com/app'
const WS_URL = 'wss://m2m.gizwits.com/wss/app/ws'

/**
 * 匿名登录（无需账号密码，通过 product_key 获取临时 token）
 */
async function anonymousLogin(productKey) {
  const res = await fetch(`${API_BASE}/anonymous/login?product_key=${productKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Gizwits-Application-Id': productKey },
    body: '{}'
  })
  if (!res.ok) throw new Error(`匿名登录失败: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return { token: data.token, uid: data.uid }
}

/**
 * 用户名密码登录
 */
async function login(username, password, productKey) {
  const res = await fetch(`${API_BASE}/login?product_key=${productKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gizwits-Application-Id': productKey
    },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error(`登录失败: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return { token: data.token, uid: data.uid }
}

/**
 * 获取绑定设备列表
 */
async function getDevices(token, productKey) {
  const res = await fetch(`${API_BASE}/devdata?product_key=${productKey}`, {
    headers: {
      'X-Gizwits-Application-Id': productKey,
      'X-Gizwits-User-Token': token
    }
  })
  if (!res.ok) throw new Error(`获取设备列表失败: ${res.status}`)
  return res.json()
}

/**
 * 读取设备最新数据点
 */
async function getDeviceDataPoints(token, productKey, did) {
  const res = await fetch(`${API_BASE}/devdata/${did}/latest?product_key=${productKey}`, {
    headers: {
      'X-Gizwits-Application-Id': productKey,
      'X-Gizwits-User-Token': token
    }
  })
  if (!res.ok) throw new Error(`获取设备数据失败: ${res.status}`)
  return res.json()
}

module.exports = {
  API_BASE,
  WS_URL,
  anonymousLogin,
  login,
  getDevices,
  getDeviceDataPoints
}
