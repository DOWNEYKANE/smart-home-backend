/**
 * 机智云 Open API 封装
 * 文档: https://docs.gizwits.com/zh-cn/Cloud/OpenAPI.html
 */

const API_BASE = 'https://api.gizwits.com/v1'
const WS_URL = 'wss://m2m.gizwits.com/wss/app/ws'

/**
 * 匿名登录（无需账号密码，通过 product_key 获取临时 token）
 */
async function anonymousLogin(productKey) {
  const url = `${API_BASE}/anonymous?product_key=${productKey}`
  console.log('[Gizwits] 匿名登录请求:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Gizwits-Application-Id': productKey
    }
  })

  const text = await res.text()
  console.log('[Gizwits] 响应状态:', res.status)
  console.log('[Gizwits] 响应内容:', text)

  if (!res.ok) {
    throw new Error(`匿名登录失败: ${res.status} - ${text}`)
  }

  const data = JSON.parse(text)
  return { token: data.token, uid: data.uid }
}

/**
 * 用户名密码登录（更稳定，推荐使用）
 */
async function login(username, password, productKey) {
  const url = `${API_BASE}/login?product_key=${productKey}`
  console.log('[Gizwits] 用户登录请求:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Gizwits-Application-Id': productKey
    },
    body: JSON.stringify({ username, password })
  })

  const text = await res.text()
  console.log('[Gizwits] 登录响应:', res.status, text)

  if (!res.ok) {
    throw new Error(`登录失败: ${res.status} - ${text}`)
  }

  const data = JSON.parse(text)
  return { token: data.token, uid: data.uid }
}

/**
 * 获取绑定设备列表
 */
async function getDevices(token, productKey) {
  const url = `${API_BASE}/devdata?product_key=${productKey}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
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
  const url = `${API_BASE}/devdata/${did}/latest?product_key=${productKey}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
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
