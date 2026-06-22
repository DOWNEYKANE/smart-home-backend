const express = require('express')
const cors = require('cors')
const config = require('./config')
const { initDatabase } = require('./db')
const { connectMQTT } = require('./mqtt')
const { authRoutes, deviceRoutes } = require('./routes')
const { authRequired } = require('./middleware/auth')

const app = express()

// CORS — 允许所有来源
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 手动处理 OPTIONS 预检请求
app.options('*', cors())

app.use(express.json())

// 健康检查
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 路由 - 认证不需要登录
app.use('/api', authRoutes)

// 路由 - 设备接口需要登录
app.use('/api', authRequired, deviceRoutes)

async function start() {
  try {
    await initDatabase()
    connectMQTT()
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] 后端服务已启动: http://0.0.0.0:${config.port}`)
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
