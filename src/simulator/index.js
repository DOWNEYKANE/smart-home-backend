const mqtt = require('mqtt')
const config = require('../config')

function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range).toFixed(1)
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

// 四类设备数据生成器
function generateEnvironmentData() {
  return {
    temperature: randomVariation(26, 4),
    humidity: randomVariation(55, 20),
    smoke: randomVariation(150, 100),
    relayStatus: Math.random() > 0.7 ? 'on' : 'off',
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateHealthData() {
  return {
    spo2: randomVariation(97, 4),
    heartRate: randomVariation(75, 20),
    measureMode: 'auto',
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateIrrigationData() {
  return {
    soilMoisture: randomVariation(42, 30),
    valveStatus: Math.random() > 0.8 ? 'on' : 'off',
    mode: 'auto',
    threshold: 35,
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateFeederData() {
  return {
    foodRemaining: randomVariation(1800, 800),
    dispenseStatus: 'idle',
    deviceStatus: 'online',
    timestamp: now()
  }
}

function startSimulator() {
  const brokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`
  const client = mqtt.connect(brokerUrl, {
    clientId: `device-simulator-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000
  })

  client.on('connect', () => {
    console.log('[Simulator] 已连接 EMQX，开始模拟设备数据')

    // 订阅控制指令
    client.subscribe('smart-home/+/command')

    // 每 5 秒上报环境数据
    setInterval(() => {
      client.publish('smart-home/environment/status', JSON.stringify(generateEnvironmentData()), { qos: 1 })
    }, 5000)

    // 每 3 秒上报健康数据
    setInterval(() => {
      client.publish('smart-home/health/status', JSON.stringify(generateHealthData()), { qos: 1 })
    }, 3000)

    // 每 5 秒上报灌溉数据
    setInterval(() => {
      client.publish('smart-home/irrigation/status', JSON.stringify(generateIrrigationData()), { qos: 1 })
    }, 5000)

    // 每 10 秒上报喂食器数据
    setInterval(() => {
      client.publish('smart-home/feeder/status', JSON.stringify(generateFeederData()), { qos: 1 })
    }, 10000)

    console.log('[Simulator] 4类设备模拟器已启动（环境5s/健康3s/灌溉5s/喂食10s）')
  })

  // 接收控制指令，模拟设备响应
  client.on('message', (topic, payload) => {
    try {
      const cmd = JSON.parse(payload.toString())
      const parts = topic.split('/')
      const deviceType = parts[1]
      console.log(`[Simulator] 收到指令 ${topic}:`, JSON.stringify(cmd))

      // 模拟设备执行指令，发布事件
      setTimeout(() => {
        client.publish(`smart-home/${deviceType}/event`, JSON.stringify({
          type: 'command_response',
          command: cmd,
          result: 'success',
          timestamp: now()
        }), { qos: 1 })
      }, 500)
    } catch (e) {
      console.error('[Simulator] 处理指令失败:', e.message)
    }
  })

  client.on('error', (err) => {
    console.error('[Simulator] 错误:', err.message)
  })

  client.on('reconnect', () => {
    console.log('[Simulator] 重连中...')
  })

  return client
}

module.exports = { startSimulator }
