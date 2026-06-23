const { WebSocketServer } = require('ws')

let wss = null

function createWebSocketServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws) => {
    console.log('[WS] 客户端已连接，当前连接数:', wss.clients.size)

    ws.on('close', () => {
      console.log('[WS] 客户端断开，当前连接数:', wss.clients.size)
    })

    // 心跳
    ws.isAlive = true
    ws.on('pong', () => { ws.isAlive = true })
  })

  // 每30秒清理死连接
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  console.log('[WS] WebSocket 服务已启动 /ws')
  return wss
}

function broadcast(data) {
  if (!wss) return
  const msg = JSON.stringify(data)
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg)
  })
}

module.exports = { createWebSocketServer, broadcast }
