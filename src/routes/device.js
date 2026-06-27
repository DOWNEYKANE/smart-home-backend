const express = require('express')
const { getPool } = require('../db')
const { authRequired } = require('../middleware/auth')
const { publishCommand } = require('../mqtt')
const { broadcast } = require('../ws')

const router = express.Router()

const LATEST_FIELDS = {
  environment: true,
  health: true,
  irrigation: true,
  feeder: true
}

// 处理 OneNET 数据推送
async function handleOneNETPush(req, res) {
  try {
    let payload = req.body
    console.log('[OneNET] 原始推送数据:', JSON.stringify(payload).substring(0, 500))
    // OneNET 推送格式：{ msg: ..., nonce: ..., signature: ... }
    let raw = payload.msg
    // 如果 msg 是 JSON 字符串，先解析
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch (e) {}
    }

    // 提取设备数据
    let data = {}
    // OneNET 数据在 raw.data.params 或 raw.params
    const params = (raw.data && raw.data.params) || raw.params
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        data[key] = (val && typeof val === 'object' && val.value !== undefined) ? val.value : val
      }
    } else if (raw.ds_id && raw.value !== undefined) {
      // 老平台数据点格式：{ ds_id: 'soil_percent', value: 50 }
      data[raw.ds_id] = raw.value
    } else {
      // 直接使用 raw 中的字段
      Object.assign(data, raw)
    }

    // OneNET 字段名映射到浇灌字段
    const irrigation = {
      soilMoisture: data.Hum || data.soilMoisture || data.soil_percent || 0,
      valveStatus: data.led ? 'on' : 'off',
      mode: data.set ? 'auto' : 'manual',
      threshold: data.num || data.threshold || 35,
      airTemp: data.Temp || 0,
      airHumi: data.Hum2 || 0,
      deviceStatus: 'online',
      timestamp: data.at || new Date().toISOString().replace('T', ' ').slice(0, 19)
    }

    console.log('[OneNET] 收到推送数据:', JSON.stringify(irrigation))

    broadcast({ type: 'device_data', deviceType: 'irrigation', data: irrigation })

    const pool = getPool()
    await pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)',
      ['irrigation', JSON.stringify(irrigation)])

    res.status(200).send('ok')
  } catch (e) {
    console.error('[OneNET] 推送处理失败:', e.message)
    res.status(500).send('error')
  }
}

// 设备上报数据接口（不需要登录，给其他小组用）
async function dataUpload(req, res) {
  try {
    const { deviceType, ...data } = req.body
    if (!deviceType || !LATEST_FIELDS[deviceType]) {
      return res.json({ code: 400, message: '请指定正确的 deviceType: environment/health/irrigation/feeder' })
    }
    const pool = getPool()
    await pool.execute('INSERT INTO device_data (device_type, data) VALUES (?, ?)', [deviceType, JSON.stringify(data)])
    broadcast({ type: 'device_data', deviceType, data })
    res.json({ code: 0, message: '数据已接收' })
  } catch (e) {
    console.error('[Device] 上报数据失败:', e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
}

// 获取设备最新数据
router.get('/:deviceType/latest', authRequired, async (req, res) => {
  try {
    const { deviceType } = req.params
    if (!LATEST_FIELDS[deviceType]) {
      return res.status(400).json({ code: 400, message: '未知设备类型' })
    }
    const pool = getPool()
    const [rows] = await pool.execute('SELECT data, created_at FROM device_data WHERE device_type = ? ORDER BY id DESC LIMIT 1', [deviceType])
    if (rows.length === 0) {
      return res.json({ deviceStatus: 'offline', timestamp: new Date().toISOString() })
    }
    res.json({
      ...JSON.parse(typeof rows[0].data === 'string' ? rows[0].data : JSON.stringify(rows[0].data)),
      timestamp: rows[0].created_at
    })
  } catch (e) {
    console.error(`[Device] 获取${req.params.deviceType}最新数据失败:`, e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// 获取设备历史数据
router.get('/:deviceType/history', authRequired, async (req, res) => {
  try {
    const { deviceType } = req.params
    if (!LATEST_FIELDS[deviceType]) {
      return res.status(400).json({ code: 400, message: '未知设备类型' })
    }
    const { startTime, endTime, page = 1, pageSize = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page))
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 20))
    const offset = (pageNum - 1) * size

    const pool = getPool()
    let sql = 'SELECT data, created_at FROM device_data WHERE device_type = ?'
    const params = [deviceType]
    if (startTime) { sql += ' AND created_at >= ?'; params.push(startTime.replace('T', ' ').slice(0, 19)) }
    if (endTime) { sql += ' AND created_at <= ?'; params.push(endTime.replace('T', ' ').slice(0, 19)) }

    const countSql = sql.replace('SELECT data, created_at', 'SELECT COUNT(*) as total')
    const [countResult] = await pool.execute(countSql, params)
    const total = countResult[0].total

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.push(size, offset)
    const [rows] = await pool.execute(sql, params)
    const records = rows.map(r => ({
      ...JSON.parse(typeof r.data === 'string' ? r.data : JSON.stringify(r.data)),
      timestamp: r.created_at
    }))
    res.json({ records, total, page: pageNum, pageSize: size })
  } catch (e) {
    console.error(`[Device] 获取${req.params.deviceType}历史数据失败:`, e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// 下发控制指令
router.post('/:deviceType/control', authRequired, async (req, res) => {
  try {
    const { deviceType } = req.params
    if (!LATEST_FIELDS[deviceType]) {
      return res.status(400).json({ code: 400, message: '未知设备类型' })
    }
    const command = req.body
    const pool = getPool()
    await pool.execute('INSERT INTO control_logs (device_type, command, result) VALUES (?, ?, 0)', [deviceType, JSON.stringify(command)])

    // 浇灌组走 OneNET API 下发指令
    if (deviceType === 'irrigation') {
      try {
        await sendOneNETCommand(command)
        return res.json({ code: 0, message: '指令已发送到OneNET', command })
      } catch (e) {
        return res.json({ code: 0, message: '指令已记录（OneNET发送失败）', command })
      }
    }

    try {
      await publishCommand(deviceType, command)
      res.json({ code: 0, message: '指令已下发', command })
    } catch (e) {
      res.json({ code: 0, message: '指令已记录', command })
    }
  } catch (e) {
    console.error(`[Device] 控制${req.params.deviceType}失败:`, e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// OneNET 属性设置
async function sendOneNETCommand(command) {
  const http = require('http')
  const params = {}

  // 映射指令到 OneNET 字段（与 onenet.c 解析对应）
  if (command.action === 'valve') {
    params.led = command.value === 'on'
  } else if (command.action === 'mode') {
    params.set = command.value === 'auto'  // set=true=自动
  } else if (command.action === 'threshold') {
    params.num = parseInt(command.value) || 35
  } else {
    return // 不支持的指令类型，忽略
  }

  const body = JSON.stringify({
    product_id: '9H5ymnKKrW',
    device_name: 'T1',
    params: params
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.iot.10086.cn',
      path: '/device/thing/property/set',
      method: 'POST',
      headers: {
        'Authorization': 'version=2018-10-31&res=products%2F9H5ymnKKrW%2Fdevices%2FT1&et=2053320694&method=md5&sign=9ziux45mbJB1eiId0p%2B%2Bvg%3D%3D',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 8000
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        console.log('[OneNET] 属性设置响应:', data.substring(0, 200))
        try {
          const r = JSON.parse(data)
          if (r.code === 0) resolve(r)
          else reject(new Error(r.msg || 'OneNET set failed'))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    setTimeout(() => { req.destroy() }, 8000)
    req.write(body)
    req.end()
  })
}

module.exports = router
module.exports.dataUpload = dataUpload
module.exports.handleOneNETPush = handleOneNETPush
