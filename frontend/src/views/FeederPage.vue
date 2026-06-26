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
      <h3>📋 喂食计划管理</h3>

      <div class="pet-form">
        <div class="form-row">
          <label>宠物种类</label>
          <select v-model="petType">
            <option value="dog_small">🐶 小型犬（<10kg）</option>
            <option value="dog_medium">🐕 中型犬（10-25kg）</option>
            <option value="dog_large">🦮 大型犬（>25kg）</option>
            <option value="cat">🐱 猫咪</option>
          </select>
        </div>
        <div class="form-row">
          <label>年龄</label>
          <input v-model.number="petAge" type="number" min="0" step="0.5" />
          <span class="unit">岁</span>
        </div>
        <div class="form-row">
          <label>体重</label>
          <input v-model.number="petWeight" type="number" min="0" step="0.1" />
          <span class="unit">kg</span>
        </div>
        <div class="form-row">
          <label>每日餐数</label>
          <select v-model="mealsPerDay">
            <option :value="2">2 餐</option>
            <option :value="3">3 餐</option>
            <option :value="4">4 餐</option>
          </select>
        </div>
        <button class="calc-btn" @click="calcPlan">📊 计算喂食方案</button>
      </div>

      <div class="plan-result" v-if="planAmount > 0">
        <div class="plan-card">
          <div class="plan-item">
            <span>🐾 宠物</span>
            <span>{{ petTypeLabel(petType) }} · {{ petAge }}岁 · {{ petWeight }}kg</span>
          </div>
          <div class="plan-item">
            <span>📅 每日总量</span>
            <span style="font-weight:600;color:var(--color-primary);">{{ planAmount }}g/天</span>
          </div>
          <div class="plan-item">
            <span>🍽️ 每餐份量</span>
            <span style="font-weight:600;">{{ (planAmount / mealsPerDay).toFixed(0) }}g × {{ mealsPerDay }}餐</span>
          </div>
          <div class="plan-item">
            <span>⏰ 喂食时间</span>
            <span>{{ feedTimes.join(' / ') }}</span>
          </div>
        </div>
        <button class="apply-btn" @click="sendCommand({ action: 'setPlan', petType, planAmount, mealsPerDay, feedTimes })">
          ✅ 应用此方案到硬件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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

const petType = ref('dog_small')
const petAge = ref(2)
const petWeight = ref(8)
const mealsPerDay = ref(2)
const planAmount = ref(0)
const feedTimes = ref([])

function petTypeLabel(type) {
  const map = { dog_small: '小型犬', dog_medium: '中型犬', dog_large: '大型犬', cat: '猫咪' }
  return map[type] || type
}

function calcPlan() {
  // 根据宠物种类和体重计算每日喂食量（按体重2%-3%）
  const ratioMap = { dog_small: 0.03, dog_medium: 0.025, dog_large: 0.02, cat: 0.03 }
  const ratio = ratioMap[petType.value] || 0.025
  planAmount.value = Math.round(petWeight.value * 1000 * ratio)

  // 生成喂食时间
  const now = new Date()
  now.setHours(7, 0, 0, 0)
  const times = []
  const interval = Math.floor(12 / mealsPerDay.value)
  for (let i = 0; i < mealsPerDay.value; i++) {
    const h = 7 + i * interval
    times.push(`${String(h).padStart(2, '0')}:00`)
  }
  feedTimes.value = times
}

const realtimeItems = computed(() => [
  { key: 'foodRemaining', label: '粮食剩余', value: device.feeder?.foodRemaining, unit: 'g', color: 'var(--color-warning)' },
  { key: 'dispenseStatus', label: '出粮状态', value: device.feeder?.dispenseStatus === 'dispensing' ? '出粮中' : '待机', color: 'var(--color-text-secondary)' },
])

const controls = computed(() => [
  { key: 'dispense50', label: '手动出粮 50g', type: 'action' },
  { key: 'dispense100', label: '手动出粮 100g', type: 'action' },
  { key: 'dispense200', label: '手动出粮 200g', type: 'action' },
])
</script>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: var(--space-lg); }
.page-title { font-size: var(--font-xl); }
.page-section { margin-top: var(--space-sm); }
.feed-plan h3 { font-size: var(--font-lg); margin-bottom: var(--space-md); }
.pet-form {
  background: var(--color-card); padding: var(--space-lg);
  border-radius: var(--radius); box-shadow: var(--shadow-card);
  display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: flex-end;
}
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: var(--font-xs); color: var(--color-text-secondary); }
.form-row input, .form-row select {
  padding: 6px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: var(--font-sm);
}
.unit { font-size: var(--font-xs); color: var(--color-text-secondary); }
.calc-btn {
  padding: 8px 20px; background: var(--color-primary); color: #fff;
  border-radius: var(--radius-sm); font-size: var(--font-md);
}
.plan-result { margin-top: var(--space-md); }
.plan-card {
  background: var(--color-card); padding: var(--space-lg);
  border-radius: var(--radius); box-shadow: var(--shadow-card);
}
.plan-item {
  display: flex; justify-content: space-between;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-md);
}
.plan-item:last-child { border-bottom: none; }
.apply-btn {
  margin-top: var(--space-md); padding: 8px 20px;
  background: var(--color-success); color: #fff;
  border-radius: var(--radius-sm); font-size: var(--font-md);
  width: 100%;
}
</style>
