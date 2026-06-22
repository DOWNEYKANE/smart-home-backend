<template>
  <div class="device-page">
    <h2 class="page-title">🐾 宠物智能喂食器</h2>

    <RealtimePanel
      :items="realtimeItems"
      :loading="device.loading.feeder"
      :lastUpdate="lastUpdate"
      :status="device.feeder?.deviceStatus || 'offline'"
    />

    <div class="page-section">
      <HistoryChart title="粮食剩余历史" :xData="chartXData" :series="chartSeries" height="320px" />
    </div>

    <div class="page-section">
      <ControlPanel
        :controls="controls"
        :pending="control.pending"
        @command="sendCommand"
      />
    </div>

    <div class="page-section feed-plan">
      <h3>喂食计划</h3>
      <div class="plan-card">
        <div class="plan-item">
          <span>🐶 小型犬</span>
          <span>早 08:00 · 50g / 晚 18:00 · 50g</span>
        </div>
        <div class="plan-item">
          <span>🐱 猫咪</span>
          <span>早 07:00 · 30g / 晚 19:00 · 30g</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getFeederHistory } from '../api/feeder'
import { useDeviceStore } from '../stores/device'
import { useDevicePage } from '../composables/useDevicePage'
import RealtimePanel from '../components/RealtimePanel.vue'
import HistoryChart from '../components/HistoryChart.vue'
import ControlPanel from '../components/ControlPanel.vue'

const device = useDeviceStore()
const { chartXData, chartSeries, lastUpdate, sendCommand, control } = useDevicePage(
  'feeder',
  () => device.fetchFeeder(),
  getFeederHistory
)

const realtimeItems = computed(() => [
  { key: 'foodRemaining', label: '粮食剩余', value: device.feeder?.foodRemaining, unit: 'g', color: 'var(--color-warning)' },
  { key: 'dispenseStatus', label: '出粮状态', value: device.feeder?.dispenseStatus === 'dispensing' ? '出粮中' : '待机', color: 'var(--color-text-secondary)' },
])

const controls = computed(() => [
  { key: 'dispense', label: '出粮 50g', type: 'action' },
  { key: 'dispense100', label: '出粮 100g', type: 'action' },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
.feed-plan h3 { font-size: var(--font-lg); margin-bottom: var(--space-md); }
.plan-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}
.plan-item {
  display: flex; justify-content: space-between;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-md);
}
.plan-item:last-child { border-bottom: none; }
</style>
