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
const { startGizwitsBridge } = require('./bridge/gizwits-bridge')

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

    // 启动机智云桥接服务（如果已配置）
    if (config.gizwits.enabled && config.gizwits.productKey) {
      const mqttBrokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`
      const httpUploadUrl = `http://localhost:${config.port}/api/device/data`
      startGizwitsBridge({
        productKey: config.gizwits.productKey,
        productSecret: config.gizwits.productSecret,
        deviceDid: config.gizwits.deviceDid,
        username: config.gizwits.username,
        password: config.gizwits.password,
        mqttUrl: mqttBrokerUrl,
        httpUrl: httpUploadUrl
      })
      console.log('[Bridge] 机智云桥接服务已启动')
    } else {
      console.log('[Bridge] 机智云桥接未启用（设置 GIZWITS_ENABLED=true 并填写 PRODUCT_KEY）')
    }

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] 已启动: http://0.0.0.0:${config.port}`)
    })
  } catch (e) {
    console.error('[Server] 启动失败:', e)
    process.exit(1)
  }
}

start()
