<template>
  <div class="device-page">
    <h2 class="page-title">🌿 花园智能浇灌系统</h2>

    <RealtimePanel
      :items="realtimeItems"
      :loading="device.loading.irrigation"
      :lastUpdate="lastUpdate"
      :status="device.irrigation?.deviceStatus || 'offline'"
    />

    <div class="page-section">
      <HistoryChart title="土壤湿度历史" :xData="chartXData" :series="chartSeries" height="320px" />
    </div>

    <div class="page-section">
      <ControlPanel
        :controls="controls"
        :pending="control.pending"
        @command="sendCommand"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getIrrigationHistory } from '../api/irrigation'
import { useDeviceStore } from '../stores/device'
import { useDevicePage } from '../composables/useDevicePage'
import RealtimePanel from '../components/RealtimePanel.vue'
import HistoryChart from '../components/HistoryChart.vue'
import ControlPanel from '../components/ControlPanel.vue'

const device = useDeviceStore()
const { chartXData, chartSeries, lastUpdate, sendCommand, control } = useDevicePage(
  'irrigation',
  () => device.fetchIrrigation(),
  getIrrigationHistory
)

const realtimeItems = computed(() => [
  { key: 'soilMoisture', label: '土壤湿度', value: device.irrigation?.soilMoisture, unit: '%', color: 'var(--color-success)' },
  { key: 'valveStatus', label: '阀门状态', value: device.irrigation?.valveStatus === 'on' ? '开启' : '关闭', color: device.irrigation?.valveStatus === 'on' ? 'var(--color-primary)' : 'var(--color-text-secondary)' },
])

const controls = computed(() => [
  {
    key: 'valve', label: '浇水开关', type: 'toggle',
    value: device.irrigation?.valveStatus || 'off',
    onValue: 'on', offValue: 'off', onLabel: '已开启', offLabel: '已关闭'
  },
  {
    key: 'mode', label: '工作模式', type: 'toggle',
    value: device.irrigation?.mode || 'auto',
    onValue: 'auto', offValue: 'manual', onLabel: '自动模式', offLabel: '手动模式'
  },
  {
    key: 'threshold', label: '湿度阈值', type: 'threshold',
    value: device.irrigation?.threshold || 35, unit: '%'
  },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
</style>
