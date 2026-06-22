import { ref, onMounted, onUnmounted } from 'vue'
import { useDeviceStore } from '../stores/device'
import { useControlStore } from '../stores/control'

export function useDevicePage(deviceType, fetchFn, historyApi, historyParams = {}) {
  const device = useDeviceStore()
  const control = useControlStore()
  const chartXData = ref([])
  const chartSeries = ref([])
  const historyLoading = ref(false)
  const lastUpdate = ref('')

  async function loadLatest() {
    await fetchFn()
    lastUpdate.value = new Date().toLocaleTimeString()
  }

  async function loadHistory() {
    historyLoading.value = true
    const res = await historyApi({ ...historyParams, page: 1, pageSize: 50 })
    chartXData.value = res.records.map(r => r.timestamp.slice(11, 19))
    chartSeries.value = buildSeries(res.records)
    historyLoading.value = false
  }

  function buildSeries(records) {
    const keys = Object.keys(records[0] || {}).filter(k =>
      !['timestamp', 'deviceStatus', 'relayStatus', 'valveStatus', 'dispenseStatus', 'measureMode', 'mode', 'threshold'].includes(k)
    )
    return keys.map(key => ({
      name: key,
      data: records.map(r => r[key])
    }))
  }

  function sendCommand(cmd) {
    control.sendCommand(deviceType, cmd)
  }

  let timer = null
  onMounted(() => {
    loadLatest()
    loadHistory()
    timer = setInterval(loadLatest, 30000)
  })
  onUnmounted(() => clearInterval(timer))

  return { device, control, chartXData, chartSeries, historyLoading, lastUpdate, sendCommand, loadLatest, loadHistory }
}
