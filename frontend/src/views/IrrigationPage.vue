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

    <div class="page-section schedule-box">
      <h3>⏰ 定时浇灌计划</h3>
      <div class="schedule-grid">
        <div class="sched-item" v-for="(time, idx) in waterTimes" :key="idx">
          <input type="time" :value="time.time" @change="e => waterTimes[idx].time = e.target.value" />
          <input type="number" :value="time.duration" @change="e => waterTimes[idx].duration = Number(e.target.value)" min="1" max="60" />
          <span>分钟</span>
          <button class="del-btn" @click="waterTimes.splice(idx, 1)">✕</button>
        </div>
        <button class="add-btn" @click="waterTimes.push({ time: '08:00', duration: 10 })">+ 添加浇灌时间</button>
        <button class="apply-sched-btn" @click="sendCommand({ action: 'setSchedule', times: waterTimes })" :disabled="waterTimes.length === 0">
          ✅ 应用定时浇灌方案
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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

const waterTimes = ref([
  { time: '06:00', duration: 10 },
  { time: '18:00', duration: 10 },
])

const realtimeItems = computed(() => [
  { key: 'soilMoisture', label: '土壤湿度', value: device.irrigation?.soilMoisture, unit: '%', color: 'var(--color-success)' },
  { key: 'valveStatus', label: '阀门状态', value: device.irrigation?.valveStatus === 'on' ? '开启' : '关闭', color: device.irrigation?.valveStatus === 'on' ? 'var(--color-primary)' : 'var(--color-text-secondary)' },
])

const controls = computed(() => [
  {
    key: 'valve', label: '浇水开关', type: 'toggle',
    value: device.irrigation?.valveStatus || 'off',
    onValue: 'on', offValue: 'off', onLabel: '已开启（点此关闭）', offLabel: '已关闭（点此开启）'
  },
  {
    key: 'mode', label: '浇灌模式', type: 'toggle',
    value: device.irrigation?.mode || 'auto',
    onValue: 'auto', offValue: 'manual', onLabel: '自动浇灌', offLabel: '手动浇灌'
  },
  {
    key: 'threshold', label: '土壤湿度阈值（低于此值自动浇水）', type: 'threshold',
    value: device.irrigation?.threshold || 35, unit: '%'
  },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
.schedule-box { background: var(--color-card); padding: var(--space-lg); border-radius: var(--radius); box-shadow: var(--shadow-card); }
.schedule-box h3 { font-size: var(--font-lg); margin-bottom: var(--space-md); }
.schedule-grid { display: flex; flex-direction: column; gap: var(--space-sm); }
.sched-item { display: flex; align-items: center; gap: var(--space-sm); }
.sched-item input { padding: 4px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.del-btn { background: var(--color-danger); color: #fff; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; }
.add-btn { padding: 6px 16px; border: 1px dashed var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-sm); background: none; }
.apply-sched-btn { padding: 8px 20px; background: var(--color-success); color: #fff; border-radius: var(--radius-sm); font-size: var(--font-md); }
.apply-sched-btn:disabled { opacity: 0.4; }
</style>
