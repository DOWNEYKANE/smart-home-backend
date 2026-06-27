<template>
  <div class="realtime-panel">
    <div class="panel-header">
      <h3>实时数据</h3>
      <span class="refresh-info">
        <span :class="['dot', loading ? 'loading' : '']"></span>
        {{ loading ? '刷新中...' : `上次更新: ${lastUpdate}` }}
      </span>
    </div>
    <div class="realtime-grid">
      <div class="realtime-item" v-for="item in items" :key="item.key">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :style="{ color: item.color }">
          {{ item.value ?? '--' }}<small v-if="item.unit">{{ item.unit }}</small>
        </span>
      </div>
    </div>
    <div class="device-status" :class="status">
      <span class="status-indicator"></span>
      设备{{ status === 'online' ? '在线' : '离线' }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  lastUpdate: { type: String, default: '' },
  status: { type: String, default: 'online' }
})
</script>

<style scoped>
.realtime-panel {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--space-md);
}
.panel-header h3 { font-size: var(--font-lg); }
.refresh-info { font-size: var(--font-xs); color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); }
.dot.loading { animation: pulse 1s infinite; background: var(--color-warning); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.realtime-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-md); }
.realtime-item {
  background: #fafafa; border-radius: var(--radius-sm);
  padding: var(--space-md); text-align: center;
}
.item-label { display: block; font-size: var(--font-xs); color: var(--color-text-secondary); margin-bottom: 4px; }
.item-value { font-size: var(--font-xl); font-weight: 600; }
.item-value small { font-size: var(--font-xs); font-weight: 400; color: var(--color-text-secondary); margin-left: 2px; }
.device-status {
  margin-top: var(--space-md); font-size: var(--font-xs);
  display: flex; align-items: center; gap: 6px;
}
.status-indicator { width: 8px; height: 8px; border-radius: 50%; }
.device-status.online { color: var(--color-success); }
.device-status.online .status-indicator { background: var(--color-success); }
.device-status.offline { color: var(--color-danger); }
.device-status.offline .status-indicator { background: var(--color-danger); }
</style>
