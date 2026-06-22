const express = require('express')
const config = require('./config')
const { initDatabase } = require('./db')
const { connectMQTT } = require('./mqtt')
const { authRoutes, deviceRoutes } = require('./routes')
const { authRequired } = require('./middleware/auth')

const app = express()

// 手动 CORS — 最可靠的方式
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())

app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api', authRoutes)
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
