<template>
  <div class="device-page">
    <h2 class="page-title">❤️ 心脏健康检测仪</h2>

    <RealtimePanel
      :items="realtimeItems"
      :loading="device.loading.health"
      :lastUpdate="lastUpdate"
      :status="device.health?.deviceStatus || 'offline'"
    />

    <div class="page-section" v-if="device.health?.spo2 < 90" style="background:#fff2f0;border:1px solid #ffccc7;border-radius:8px;padding:12px 16px;">
      <span style="color:var(--color-danger);font-weight:600;">⚠️ 血氧含量低于90%，请关注！</span>
    </div>

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
import { getHealthHistory } from '../api/health'
import { useDeviceStore } from '../stores/device'
import { useDevicePage } from '../composables/useDevicePage'
import RealtimePanel from '../components/RealtimePanel.vue'
import HistoryChart from '../components/HistoryChart.vue'
import ControlPanel from '../components/ControlPanel.vue'

const device = useDeviceStore()
const { chartXData, chartSeries, lastUpdate, sendCommand, control } = useDevicePage(
  'health',
  () => device.fetchHealth(),
  getHealthHistory
)

const realtimeItems = computed(() => [
  { key: 'spo2', label: '血氧', value: device.health?.spo2, unit: '%', color: device.health?.spo2 < 90 ? 'var(--color-danger)' : 'var(--color-success)' },
  { key: 'heartRate', label: '心率', value: device.health?.heartRate, unit: 'bpm', color: 'var(--color-primary)' },
])

const controls = computed(() => [
  {
    key: 'measureMode', label: '测量模式', type: 'toggle',
    value: device.health?.measureMode || 'auto',
    onValue: 'auto', offValue: 'manual', onLabel: '自动测量', offLabel: '手动测量'
  },
  {
    key: 'manualMeasure', label: '手动测量', type: 'action'
  },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
</style>
