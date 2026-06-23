const express = require('express')
const path = require('path')
const config = require('./config')
const { initDatabase } = require('./db')
const { connectMQTT } = require('./mqtt')
const { authRoutes, deviceRoutes } = require('./routes')
const { authRequired } = require('./middleware/auth')

const app = express()

app.use(express.json())

// API 路由
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})
app.use('/api', authRoutes)
app.use('/api', authRequired, deviceRoutes)

// 静态文件
const staticDir = path.join(__dirname, '..', 'dist')
app.use(express.static(staticDir))

// 兜底：直接返回 index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  const fs = require('fs')
  const html = path.join(staticDir, 'index.html')
  if (fs.existsSync(html)) {
    res.sendFile(html)
  } else {
    res.status(500).send('dist/index.html not found. Files: ' + fs.readdirSync(staticDir).join(', '))
  }
})

async function start() {
  try {
    await initDatabase()
    console.log('[DB] 数据库就绪')
    connectMQTT()
    console.log('[MQTT] MQTT 客户端已启动')
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] 后端+前端服务已启动: http://0.0.0.0:${config.port}`)
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
