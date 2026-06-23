const express = require('express')
const path = require('path')
const http = require('http')
const config = require('./config')
const { initDatabase } = require('./db')
const { connectMQTT } = require('./mqtt')
const { startSimulator } = require('./simulator')
const { createWebSocketServer } = require('./ws')
const { authRoutes, deviceRoutes } = require('./routes')
const { authRequired } = require('./middleware/auth')

const app = express()
const server = http.createServer(app)

app.use(express.json())

// API 路由
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})
app.use('/api', authRoutes)
app.use('/api', authRequired, deviceRoutes)

// WebSocket
createWebSocketServer(server)

// 静态文件 + SPA fallback
const staticDir = path.join(__dirname, '..', 'dist')
app.use(express.static(staticDir))
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticDir, 'index.html'))
  }
})

async function start() {
  try {
    await initDatabase()
    console.log('[DB] 数据库就绪')

    connectMQTT()
    console.log('[MQTT] MQTT 客户端已启动')

    startSimulator()

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] 已启动: http://0.0.0.0:${config.port}`)
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
