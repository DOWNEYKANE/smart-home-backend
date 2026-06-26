import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { getEnvironmentLatest } from '../api/environment'
import { getHealthLatest } from '../api/health'
import { getIrrigationLatest } from '../api/irrigation'
import { getFeederLatest } from '../api/feeder'

export const useDeviceStore = defineStore('device', () => {
  const environment = ref(null)
  const health = ref(null)
  const irrigation = ref(null)
  const feeder = ref(null)
  const loading = reactive({ environment: false, health: false, irrigation: false, feeder: false })

  // 从 WebSocket 实时更新数据
  function updateFromWS(msg) {
    if (msg.type !== 'device_data') return
    const { deviceType, data } = msg
    switch (deviceType) {
      case 'environment':
        environment.value = data
        break
      case 'health':
        health.value = data
        break
      case 'irrigation':
        irrigation.value = data
        break
      case 'feeder':
        feeder.value = data
        break
    }
  }

  async function fetchEnvironment() {
    loading.environment = true
    environment.value = await getEnvironmentLatest()
    loading.environment = false
  }

  async function fetchHealth() {
    loading.health = true
    health.value = await getHealthLatest()
    loading.health = false
  }

  async function fetchIrrigation() {
    loading.irrigation = true
    irrigation.value = await getIrrigationLatest()
    loading.irrigation = false
  }

  async function fetchFeeder() {
    loading.feeder = true
    feeder.value = await getFeederLatest()
    loading.feeder = false
  }

  async function fetchAll() {
    await Promise.all([
      fetchEnvironment(),
      fetchHealth(),
      fetchIrrigation(),
      fetchFeeder()
    ])
  }

  return { environment, health, irrigation, feeder, loading, updateFromWS, fetchEnvironment, fetchHealth, fetchIrrigation, fetchFeeder, fetchAll }
})
