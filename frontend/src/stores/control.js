import { defineStore } from 'pinia'
import { ref } from 'vue'
import { controlEnvironment } from '../api/environment'
import { controlHealth } from '../api/health'
import { controlIrrigation } from '../api/irrigation'
import { controlFeeder } from '../api/feeder'

const apiMap = {
  environment: controlEnvironment,
  health: controlHealth,
  irrigation: controlIrrigation,
  feeder: controlFeeder
}

export const useControlStore = defineStore('control', () => {
  const pending = ref(false)
  const lastResult = ref(null)

  async function sendCommand(deviceType, command) {
    pending.value = true
    const api = apiMap[deviceType]
    if (api) {
      lastResult.value = await api(command)
    }
    pending.value = false
  }

  return { pending, lastResult, sendCommand }
})
