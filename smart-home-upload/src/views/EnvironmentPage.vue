<template>
  <div class="device-page">
    <h2 class="page-title">🌡️ 室内环境监控</h2>

    <RealtimePanel
      :items="realtimeItems"
      :loading="device.loading.environment"
      :lastUpdate="lastUpdate"
      :status="device.environment?.deviceStatus || 'offline'"
    />

    <div class="page-section">
      <HistoryChart title="历史数据" :xData="chartXData" :series="chartSeries" height="320px" />
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
import { getEnvironmentHistory } from '../api/environment'
import { useDeviceStore } from '../stores/device'
import { useDevicePage } from '../composables/useDevicePage'
import RealtimePanel from '../components/RealtimePanel.vue'
import HistoryChart from '../components/HistoryChart.vue'
import ControlPanel from '../components/ControlPanel.vue'

const device = useDeviceStore()
const { chartXData, chartSeries, lastUpdate, sendCommand, control } = useDevicePage(
  'environment',
  () => device.fetchEnvironment(),
  getEnvironmentHistory
)

const realtimeItems = computed(() => [
  { key: 'temperature', label: '温度', value: device.environment?.temperature, unit: '°C', color: 'var(--color-danger)' },
  { key: 'humidity', label: '湿度', value: device.environment?.humidity, unit: '%', color: 'var(--color-primary)' },
  { key: 'smoke', label: '烟雾浓度', value: device.environment?.smoke, unit: 'ppm', color: 'var(--color-warning)' },
])

const controls = computed(() => [
  {
    key: 'relay', label: '处理设备', type: 'toggle',
    value: device.environment?.relayStatus || 'off',
    onValue: 'on', offValue: 'off', onLabel: '已开启', offLabel: '已关闭'
  },
  {
    key: 'tempThreshold', label: '温度阈值', type: 'threshold',
    value: 30, unit: '°C'
  },
  {
    key: 'humidityThreshold', label: '湿度阈值', type: 'threshold',
    value: 70, unit: '%'
  },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
</style>
