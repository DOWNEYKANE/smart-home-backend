<template>
  <div class="history-chart">
    <div class="chart-header" v-if="title">
      <h3>{{ title }}</h3>
    </div>
    <div ref="chartRef" class="chart-container" :style="{ height }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  title: { type: String, default: '' },
  xData: { type: Array, required: true },
  series: { type: Array, required: true },
  height: { type: String, default: '300px' }
})

const chartRef = ref(null)
let chart = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: props.xData,
      axisLabel: { fontSize: 11, rotate: 30 }
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series: props.series.map(s => ({ type: 'line', smooth: true, ...s }))
  })
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
})

watch(() => [props.xData, props.series], () => {
  nextTick(() => {
    if (chart) {
      chart.setOption({
        xAxis: { data: props.xData },
        series: props.series.map(s => ({ type: 'line', smooth: true, ...s }))
      })
    }
  })
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.history-chart {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}
.chart-header h3 {
  font-size: var(--font-lg);
  margin-bottom: var(--space-md);
}
.chart-container { width: 100%; }
</style>
