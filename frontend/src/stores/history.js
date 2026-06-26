import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  getEnvironmentHistory,
  getHealthHistory,
  getIrrigationHistory,
  getFeederHistory
} from '../api'

const apiMap = {
  environment: getEnvironmentHistory,
  health: getHealthHistory,
  irrigation: getIrrigationHistory,
  feeder: getFeederHistory
}

export const useHistoryStore = defineStore('history', () => {
  const records = ref([])
  const total = ref(0)
  const loading = ref(false)
  const filters = reactive({
    deviceType: '',
    startTime: '',
    endTime: '',
    page: 1,
    pageSize: 20
  })

  async function fetchHistory() {
    if (!filters.deviceType) return
    loading.value = true
    const api = apiMap[filters.deviceType]
    if (api) {
      const res = await api({
        startTime: filters.startTime,
        endTime: filters.endTime,
        page: filters.page,
        pageSize: filters.pageSize
      })
      records.value = res.records
      total.value = res.total
    }
    loading.value = false
  }

  function setFilters(f) {
    Object.assign(filters, f)
    filters.page = 1
  }

  return { records, total, loading, filters, fetchHistory, setFilters }
})
