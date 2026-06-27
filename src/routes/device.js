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
    // OneNET 推送格式：{ msg: ..., nonce: ..., signature: ... }
    let raw = payload.msg
    // 如果 msg 是 JSON 字符串，先解析
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch (e) {}
    }

    // 提取设备数据
    let data = {}
    if (raw.params) {
      // OneNET Studio 格式：{ params: { soil_percent: { value: 50 } } }
      for (const [key, val] of Object.entries(raw.params)) {
        data[key] = (val && typeof val === 'object' && val.value !== undefined) ? val.value : val
      }
    } else if (raw.ds_id && raw.value !== undefined) {
      // 老平台数据点格式：{ ds_id: 'soil_percent', value: 50 }
      data[raw.ds_id] = raw.value
    } else {
      // 直接使用 raw 中的字段
      Object.assign(data, raw)
    }

    // 映射字段名
    const irrigation = {
      soilMoisture: data.soilMoisture || data.soil_percent || data.soil_humi || 50,
      valveStatus: data.valveStatus || data.valve || data.pump_state || 'off',
      mode: data.mode || data.current_mode || 'auto',
      threshold: data.threshold || data.humidity_threshold_pct || 35,
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

module.exports = router
module.exports.dataUpload = dataUpload
module.exports.handleOneNETPush = handleOneNETPush
