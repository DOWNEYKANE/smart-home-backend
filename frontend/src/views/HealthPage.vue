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
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <button :class="['filter-btn', { active: showLowSpo2 }]" @click="showLowSpo2 = !showLowSpo2">
          {{ showLowSpo2 ? '✅ 仅显示血氧<90%' : '🔘 仅显示血氧<90%' }}
        </button>
        <span style="font-size:12px;color:var(--color-text-secondary);" v-if="showLowSpo2">
          已筛选出 {{ lowSpo2Count }} 条低于90%的记录
        </span>
      </div>
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
import { computed, ref, watch } from 'vue'
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

const showLowSpo2 = ref(false)
const allRecords = ref([])

// 当 chartSeries 更新时，保存全量数据
watch(() => chartSeries.value, (series) => {
  if (!showLowSpo2.value && series.length > 0) {
    allRecords.value = series
  }
}, { deep: true })

const lowSpo2Count = computed(() => {
  if (chartXData.value.length === 0) return 0
  const spo2Series = chartSeries.value.find(s => s.name && s.name.includes('血氧'))
  if (!spo2Series) return 0
  return spo2Series.data.filter(v => v < 90).length
})

const realtimeItems = computed(() => [
  { key: 'spo2', label: '血氧', value: device.health?.spo2, unit: '%', color: device.health?.spo2 < 90 ? 'var(--color-danger)' : 'var(--color-success)' },
  { key: 'heartRate', label: '心率', value: device.health?.heartRate, unit: 'bpm', color: 'var(--color-primary)' },
])

const controls = computed(() => [
  {
    key: 'measureMode', label: '测量模式', type: 'toggle',
    value: device.health?.measureMode || 'auto',
    onValue: 'auto', offValue: 'manual', onLabel: '自动测量（点此切换手动）', offLabel: '手动测量（点此切换自动）'
  },
  {
    key: 'measureInterval', label: '自动测量间隔', type: 'threshold',
    value: 5, unit: '秒'
  },
  {
    key: 'manualMeasure', label: '手动测量一次', type: 'action'
  },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
.filter-btn {
  padding: 6px 16px; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: var(--font-sm);
  background: var(--color-card); cursor: pointer;
}
.filter-btn.active {
  background: var(--color-danger); color: #fff; border-color: var(--color-danger);
}
</style>
