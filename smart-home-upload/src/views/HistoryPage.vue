<template>
  <div class="history-page">
    <h2 class="page-title">📋 历史记录</h2>

    <FilterBar
      :fields="filterFields"
      :modelValue="history.filters"
      @update:modelValue="onFilterUpdate"
      @search="history.fetchHistory()"
      @reset="resetFilters"
    />

    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
      <ExportButton
        :data="history.records"
        :columns="tableColumns"
        :filename="`history-${history.filters.deviceType || 'all'}-${Date.now()}`"
        :disabled="history.records.length === 0"
      />
    </div>

    <DataTable
      :columns="tableColumns"
      :data="history.records"
      :total="history.total"
      :page="history.filters.page"
      :pageSize="history.filters.pageSize"
      @page-change="onPageChange"
    >
      <template #cell-deviceType="{ value }">
        {{ deviceTypeLabel(value) }}
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useHistoryStore } from '../stores/history'
import FilterBar from '../components/FilterBar.vue'
import DataTable from '../components/DataTable.vue'
import ExportButton from '../components/ExportButton.vue'

const history = useHistoryStore()

const filterFields = [
  {
    key: 'deviceType', label: '设备类型', type: 'select',
    options: [
      { value: 'environment', label: '环境监控' },
      { value: 'health', label: '心脏健康' },
      { value: 'irrigation', label: '智能浇灌' },
      { value: 'feeder', label: '宠物喂食' },
    ]
  },
  { key: 'startTime', label: '开始时间', type: 'datetime-local' },
  { key: 'endTime', label: '结束时间', type: 'datetime-local' },
]

const tableColumns = [
  { title: '时间', key: 'timestamp', width: '180px' },
  { title: '温度(°C)', key: 'temperature', width: '100px' },
  { title: '湿度(%)', key: 'humidity', width: '100px' },
  { title: '烟雾(ppm)', key: 'smoke', width: '100px' },
  { title: '血氧(%)', key: 'spo2', width: '100px' },
  { title: '心率(bpm)', key: 'heartRate', width: '100px' },
  { title: '土壤湿度(%)', key: 'soilMoisture', width: '110px' },
  { title: '粮食剩余(g)', key: 'foodRemaining', width: '110px' },
]

function deviceTypeLabel(type) {
  const map = { environment: '环境监控', health: '心脏健康', irrigation: '智能浇灌', feeder: '宠物喂食' }
  return map[type] || type
}

function onFilterUpdate(val) {
  Object.assign(history.filters, val)
}

function resetFilters() {
  history.filters.deviceType = ''
  history.filters.startTime = ''
  history.filters.endTime = ''
  history.filters.page = 1
  history.records = []
  history.total = 0
}

function onPageChange(page) {
  history.filters.page = page
  history.fetchHistory()
}

onMounted(() => {
  history.filters.deviceType = 'environment'
  history.fetchHistory()
})
</script>

<style scoped>
.history-page { display: flex; flex-direction: column; gap: 0; }
.page-title { font-size: var(--font-xl); margin-bottom: var(--space-lg); }
</style>
