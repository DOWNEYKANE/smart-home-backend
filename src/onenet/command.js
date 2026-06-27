// OneNET MQTT 下发指令
const mqtt = require('mqtt')

const BROKER = 'mqtts://studio-mqtt.heclouds.com'
const PRODUCT_ID = '9H5ymnKKrW'
const DEVICE_ID = 'T1'
// 设备密钥（base64）
const MASTER_KEY = 'xbsxadMtQ4UVYXff2y+xsaffh8vHS9WPfenlP1mXPTs='
// 发布 topic（设备接收指令）
const CMD_TOPIC = `$sys/${PRODUCT_ID}/${DEVICE_ID}/thing/property/set`

let client = null
let ready = false

function connect() {
  client = mqtt.connect(BROKER, {
    port: 8883,
    clientId: DEVICE_ID + '-cmd-' + Math.random().toString(16).slice(2, 8),
    username: PRODUCT_ID,
    password: 'version=2018-10-31&res=products%2F9H5ymnKKrW%2Fdevices%2FT1&et=2053320694&method=md5&sign=9ziux45mbJB1eiId0p%2B%2Bvg%3D%3D',
    clean: true,
    rejectUnauthorized: false,
    reconnectPeriod: 5000,
    connectTimeout: 5000
  })

  client.on('connect', () => {
    console.log('[OneNET-CMD] MQTT 已连接')
    ready = true
  })

  client.on('error', (err) => {
    ready = false
    console.error('[OneNET-CMD] MQTT错误:', err.message)
  })

  client.on('reconnect', () => console.log('[OneNET-CMD] 重连...'))
  client.on('close', () => { ready = false })
}

function mapCommandToParams(command) {
  const params = {}
  // 前端 action → OneNET 属性
  if (command.action === 'valve') {
    params.led = command.value === 'on'
  } else if (command.action === 'mode') {
    params.set = command.value === 'auto'
  } else if (command.action === 'threshold') {
    params.num = parseInt(command.value) || 35
  }
  return params
}

function sendCommand(command) {
  const params = mapCommandToParams(command)

  if (Object.keys(params).length === 0) {
    console.log('[OneNET-CMD] 不明指令:', JSON.stringify(command))
    return Promise.reject(new Error('不明指令'))
  }

  if (!client || !ready) {
    console.log('[OneNET-CMD] MQTT未连接，无法发送指令')
    return Promise.reject(new Error('MQTT未连接'))
  }

  const msg = JSON.stringify({
    id: Date.now().toString(),
    version: '1.0',
    params: params
  })

  return new Promise((resolve, reject) => {
    client.publish(CMD_TOPIC, msg, { qos: 1 }, (err) => {
      if (err) {
        console.error('[OneNET-CMD] 发送失败:', err.message)
        reject(err)
      } else {
        console.log('[OneNET-CMD] 指令已发送:', msg.substring(0, 200))
        resolve(true)
      }
    })
  })
}

// 启动连接
connect()

module.exports = { sendCommand }
