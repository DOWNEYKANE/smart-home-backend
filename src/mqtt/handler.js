const { getPool } = require('../db')
const { broadcast } = require('../ws')

async function saveDeviceData(deviceType, data) {
  const pool = getPool()
  await pool.execute(
    'INSERT INTO device_data (device_type, data) VALUES (?, ?)',
    [deviceType, JSON.stringify(data)]
  )

  // 通过 WebSocket 推送到所有前端客户端
  broadcast({ type: 'device_data', deviceType, data })
}

module.exports = { saveDeviceData }
