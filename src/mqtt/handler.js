const { getPool } = require('../db')

async function saveDeviceData(deviceType, data) {
  const pool = getPool()
  await pool.execute(
    'INSERT INTO device_data (device_type, data) VALUES (?, ?)',
    [deviceType, JSON.stringify(data)]
  )
}

module.exports = { saveDeviceData }
