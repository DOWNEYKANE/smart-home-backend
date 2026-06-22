<template>
  <div class="dashboard-page">
    <h2 class="page-title">仪表盘</h2>

    <div class="stat-grid">
      <StatCard title="温度" :value="device.environment?.temperature" unit="°C" icon="🌡️"
        color="var(--color-danger)" :trend="0.5" />
      <StatCard title="湿度" :value="device.environment?.humidity" unit="%" icon="💧"
        color="var(--color-primary)" :trend="-2.0" />
      <StatCard title="烟雾浓度" :value="device.environment?.smoke" unit="ppm" icon="🔥"
        color="var(--color-warning)" />
      <StatCard title="血氧" :value="device.health?.spo2" unit="%" icon="❤️"
        color="var(--color-danger)" />
      <StatCard title="心率" :value="device.health?.heartRate" unit="bpm" icon="💓"
        color="var(--color-primary)" />
      <StatCard title="土壤湿度" :value="device.irrigation?.soilMoisture" unit="%" icon="🌿"
        color="var(--color-success)" />
      <StatCard title="粮食剩余" :value="device.feeder?.foodRemaining" unit="g" icon="🐾"
        color="var(--color-warning)" />
    </div>

    <div class="quick-actions">
      <h3>快捷操作</h3>
      <div class="action-grid">
        <button class="quick-action-btn" @click="quickControl('environment', 'relay', device.environment?.relayStatus === 'on' ? 'off' : 'on')">
          🌡️ {{ device.environment?.relayStatus === 'on' ? '关闭' : '开启' }}环境处理设备
        </button>
        <button class="quick-action-btn" @click="quickControl('health', 'manualMeasure')">
          ❤️ 手动测量一次
        </button>
        <button class="quick-action-btn" @click="quickControl('irrigation', 'valve', device.irrigation?.valveStatus === 'on' ? 'off' : 'on')">
          🌿 {{ device.irrigation?.valveStatus === 'on' ? '关闭' : '开启' }}浇水
        </button>
        <button class="quick-action-btn" @click="quickControl('feeder', 'dispense', { amount: 50 })">
          🐾 出粮 50g
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useDeviceStore } from '../stores/device'
import { useControlStore } from '../stores/control'
import StatCard from '../components/StatCard.vue'

const device = useDeviceStore()
const control = useControlStore()

let timer = null

onMounted(() => {
  device.fetchAll()
  timer = setInterval(() => device.fetchAll(), 30000)
})

onUnmounted(() => {
  clearInterval(timer)
})

function quickControl(deviceType, action, value) {
  control.sendCommand(deviceType, { action, value })
}
</script>

<style scoped>
.page-title { font-size: var(--font-xl); margin-bottom: var(--space-lg); }
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}
.quick-actions { margin-top: var(--space-xl); }
.quick-actions h3 { font-size: var(--font-lg); margin-bottom: var(--space-md); }
.action-grid { display: flex; flex-wrap: wrap; gap: var(--space-md); }
.quick-action-btn {
  padding: 10px 20px;
  background: var(--color-card);
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius);
  font-size: var(--font-md);
  box-shadow: var(--shadow-card);
  transition: all 0.15s;
}
.quick-action-btn:hover { border-color: var(--color-primary) !important; color: var(--color-primary); }
</style>
