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

// 健康检查
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 设备数据上报接口（不需要登录，给其他小组用）
app.post('/api/device/data', require('./routes/device').dataUpload)

// 认证接口
app.use('/api', authRoutes)
// 设备接口（需要登录）
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
      console.log(`[Server] HTTPS 端口: ${config.port}`)
    })

    // 额外监听 80 端口给 ESP8266 AT 指令用（HTTP 无加密）
    const http = require('http')
    const httpApp = express()
    httpApp.use(express.json())
    httpApp.get('/api/health-check', (req, res) => res.json({ status: 'ok' }))
    httpApp.post('/api/device/data', require('./routes/device').dataUpload)
    http.createServer(httpApp).listen(80, '0.0.0.0', () => {
      console.log('[Server] HTTP 端口已开启: 80')
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
