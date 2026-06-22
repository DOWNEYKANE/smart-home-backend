const express = require('express')
const cors = require('cors')
const config = require('./config')
const { initDatabase } = require('./db')
const { connectMQTT } = require('./mqtt')
const { authRoutes, deviceRoutes } = require('./routes')
const { authRequired } = require('./middleware/auth')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 路由 - 认证不需要登录
app.use('/api', authRoutes)

// 路由 - 设备接口需要登录
app.use('/api', authRequired, deviceRoutes)

// 启动
async function start() {
  try {
    await initDatabase()
    console.log('[DB] 数据库就绪')

    connectMQTT()
    console.log('[MQTT] MQTT 客户端已启动')

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] 后端服务已启动: http://0.0.0.0:${config.port}`)
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
