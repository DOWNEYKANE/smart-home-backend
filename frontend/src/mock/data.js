function randomVariation(base, range) {
  return +(base + (Math.random() - 0.5) * range).toFixed(1)
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

export function generateEnvironmentData() {
  return {
    temperature: randomVariation(26, 4),
    humidity: randomVariation(55, 20),
    smoke: randomVariation(150, 100),
    relayStatus: Math.random() > 0.7 ? 'on' : 'off',
    deviceStatus: 'online',
    timestamp: now()
  }
}

export function generateHealthData() {
  return {
    spo2: randomVariation(97, 4),
    heartRate: randomVariation(75, 20),
    measureMode: 'auto',
    deviceStatus: 'online',
    timestamp: now()
  }
}

export function generateIrrigationData() {
  return {
    soilMoisture: randomVariation(42, 30),
    valveStatus: Math.random() > 0.8 ? 'on' : 'off',
    mode: 'auto',
    threshold: 35,
    deviceStatus: 'online',
    timestamp: now()
  }
}

export function generateFeederData() {
  return {
    foodRemaining: randomVariation(1800, 800),
    dispenseStatus: 'idle',
    deviceStatus: 'online',
    timestamp: now()
  }
}

function generateHistory(baseGen, count) {
  const records = []
  const base = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(base - i * 5 * 60 * 1000)
    records.push({
      ...baseGen(),
      timestamp: t.toISOString().replace('T', ' ').slice(0, 19)
    })
  }
  return records
}

export function generateEnvironmentHistory(count = 100) {
  return generateHistory(generateEnvironmentData, count)
}

export function generateHealthHistory(count = 100) {
  return generateHistory(generateHealthData, count)
}

export function generateIrrigationHistory(count = 100) {
  return generateHistory(generateIrrigationData, count)
}

export function generateFeederHistory(count = 100) {
  return generateHistory(generateFeederData, count)
}
