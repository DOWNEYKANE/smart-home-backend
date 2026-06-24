const mysql = require('mysql2/promise')
const config = require('../config')

let pool = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true
    })
  }
  return pool
}

async function initDatabase() {
  // 先连接 MySQL（不指定数据库），创建数据库
  const initPool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password
  })
  await initPool.execute(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARACTER SET utf8mb4`)
  await initPool.end()

  // 连到目标数据库，建表
  const pool = getPool()

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(200) NOT NULL,
      nickname VARCHAR(50) DEFAULT '',
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS device_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_type VARCHAR(20) NOT NULL,
      data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_device_type_time (device_type, created_at)
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS control_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_type VARCHAR(20) NOT NULL,
      command JSON NOT NULL,
      result INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 插入默认管理员
  const bcrypt = require('bcryptjs')
  const hash = bcrypt.hashSync('123456', 10)
  await pool.execute(
    `INSERT IGNORE INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)`,
    ['admin', hash, '管理员', 'admin']
  )

  console.log('[DB] 数据库初始化完成')
  return pool
}

module.exports = { getPool, initDatabase }
