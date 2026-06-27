import { ref, onMounted, onUnmounted } from 'vue'

export function useWebSocket(onMessage) {
  const connected = ref(false)
  let ws = null

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${location.host}/ws`

    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      console.log('[WS] 已连接')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (onMessage) onMessage(data)
      } catch (e) {
        console.error('[WS] 消息解析失败:', e)
      }
    }

    ws.onclose = () => {
      connected.value = false
      console.log('[WS] 断开，3秒后重连')
      setTimeout(connect, 3000)
    }

    ws.onerror = (e) => {
      console.error('[WS] 错误:', e)
    }
  }

  onMounted(() => connect())

  onUnmounted(() => {
    if (ws) ws.close()
  })

  return { connected }
}
