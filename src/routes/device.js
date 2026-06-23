const express = require('express')
const { getPool } = require('../db')
const { authRequired } = require('../middleware/auth')
const { publishCommand } = require('../mqtt')

const router = express.Router()

// 各设备类型的最新数据字段映射
const LATEST_FIELDS = {
  environment: 'temperature, humidity, smoke, relayStatus, deviceStatus',
  health: 'spo2, heartRate, measureMode, deviceStatus',
  irrigation: 'soilMoisture, valveStatus, mode, threshold, deviceStatus',
  feeder: 'foodRemaining, dispenseStatus, deviceStatus'
}

/**
 * GET /api/:deviceType/latest
 * 获取设备最新数据
 */
router.get('/:deviceType/latest', authRequired, async (req, res) => {
  try {
    const { deviceType } = req.params
    if (!LATEST_FIELDS[deviceType]) {
      return res.status(400).json({ code: 400, message: '未知设备类型' })
    }

    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT data, created_at FROM device_data WHERE device_type = ? ORDER BY id DESC LIMIT 1',
      [deviceType]
    )

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

/**
 * GET /api/:deviceType/history
 * 获取设备历史数据
 */
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

    if (startTime) {
      sql += ' AND created_at >= ?'
      params.push(startTime)
    }
    if (endTime) {
      sql += ' AND created_at <= ?'
      params.push(endTime)
    }

    // 获取总数
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

/**
 * POST /api/:deviceType/control
 * 下发控制指令给设备
 */
router.post('/:deviceType/control', authRequired, async (req, res) => {
  try {
    const { deviceType } = req.params
    if (!LATEST_FIELDS[deviceType]) {
      return res.status(400).json({ code: 400, message: '未知设备类型' })
    }

    const command = req.body

    // 保存操作日志
    const pool = getPool()
    await pool.execute(
      'INSERT INTO control_logs (device_type, command, result) VALUES (?, ?, 0)',
      [deviceType, JSON.stringify(command)]
    )

    // 通过 MQTT 下发指令
    try {
      await publishCommand(deviceType, command)
      res.json({ code: 0, message: '指令已下发', command })
    } catch (e) {
      res.json({ code: 0, message: '指令已记录（MQTT未连接，设备下次上线后执行）', command })
    }
  } catch (e) {
    console.error(`[Device] 控制${req.params.deviceType}失败:`, e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router
