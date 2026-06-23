const mqtt = require('mqtt')
const config = require('../config')

// 设备状态（收到指令后才改变）
const state = {
  relayStatus: 'off',
  valveStatus: 'off',
  dispenseStatus: 'idle',
  mode: 'auto',
  measureMode: 'auto',
  threshold: 35,
  foodRemaining: 1800
}

function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range).toFixed(1)
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function generateEnvironmentData() {
  return {
    temperature: randomVariation(26, 4),
    humidity: randomVariation(55, 20),
    smoke: randomVariation(150, 100),
    relayStatus: state.relayStatus,
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateHealthData() {
  return {
    spo2: randomVariation(97, 4),
    heartRate: randomVariation(75, 20),
    measureMode: state.measureMode,
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateIrrigationData() {
  return {
    soilMoisture: randomVariation(42, 30),
    valveStatus: state.valveStatus,
    mode: state.mode,
    threshold: state.threshold,
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateFeederData() {
  return {
    foodRemaining: state.foodRemaining,
    dispenseStatus: state.dispenseStatus,
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

    client.subscribe('smart-home/+/command')

    setInterval(() => {
      client.publish('smart-home/environment/status', JSON.stringify(generateEnvironmentData()), { qos: 1 })
    }, 5000)

    setInterval(() => {
      client.publish('smart-home/health/status', JSON.stringify(generateHealthData()), { qos: 1 })
    }, 3000)

    setInterval(() => {
      client.publish('smart-home/irrigation/status', JSON.stringify(generateIrrigationData()), { qos: 1 })
    }, 5000)

    setInterval(() => {
      client.publish('smart-home/feeder/status', JSON.stringify(generateFeederData()), { qos: 1 })
    }, 5000)

    console.log('[Simulator] 4类设备模拟器已启动')
  })

  // 接收控制指令
  client.on('message', (topic, payload) => {
    try {
      const cmd = JSON.parse(payload.toString())
      const parts = topic.split('/')
      const deviceType = parts[1]

      console.log(`[Simulator] 收到指令 → ${deviceType}:`, JSON.stringify(cmd))

      // 更新状态
      if (cmd.action === 'relay') {
        state.relayStatus = cmd.value
      } else if (cmd.action === 'valve') {
        state.valveStatus = cmd.value
      } else if (cmd.action === 'mode') {
        state.mode = cmd.value
        if (deviceType === 'health') state.measureMode = cmd.value
      } else if (cmd.action === 'measureMode') {
        state.measureMode = cmd.value
      } else if (cmd.action === 'threshold') {
        state.threshold = parseFloat(cmd.value) || 35
      } else if (cmd.action === 'dispense50') {
        state.dispenseStatus = 'dispensing'
        state.foodRemaining = Math.max(0, state.foodRemaining - 50)
        setTimeout(() => { state.dispenseStatus = 'idle' }, 3000)
      } else if (cmd.action === 'dispense100') {
        state.dispenseStatus = 'dispensing'
        state.foodRemaining = Math.max(0, state.foodRemaining - 100)
        setTimeout(() => { state.dispenseStatus = 'idle' }, 3000)
      } else if (cmd.action === 'dispense200') {
        state.dispenseStatus = 'dispensing'
        state.foodRemaining = Math.max(0, state.foodRemaining - 200)
        setTimeout(() => { state.dispenseStatus = 'idle' }, 3000)
      }

      client.publish(`smart-home/${deviceType}/event`, JSON.stringify({
        type: 'command_response',
        command: cmd,
        result: 'success',
        timestamp: now()
      }), { qos: 1 })
    } catch (e) {
      console.error('[Simulator] 指令处理失败:', e.message)
    }
  })

  client.on('error', (err) => {
    console.error('[Simulator] 连接错误:', err.message)
  })

  return client
}

module.exports = { startSimulator }
