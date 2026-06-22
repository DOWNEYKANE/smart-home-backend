<template>
  <div class="control-panel">
    <h3 class="control-title">设备控制</h3>
    <div class="control-grid">
      <div class="control-item" v-for="ctrl in controls" :key="ctrl.key">
        <span class="control-label">{{ ctrl.label }}</span>
        <button
          v-if="ctrl.type === 'toggle'"
          :class="['toggle-btn', ctrl.value === ctrl.onValue ? 'active' : '']"
          @click="$emit('command', { action: ctrl.key, value: ctrl.value === ctrl.onValue ? ctrl.offValue : ctrl.onValue })"
        >
          {{ ctrl.value === ctrl.onValue ? ctrl.onLabel : ctrl.offLabel }}
        </button>
        <button
          v-else-if="ctrl.type === 'action'"
          class="action-btn"
          @click="$emit('command', { action: ctrl.key })"
          :disabled="pending"
        >
          {{ ctrl.label }}
        </button>
        <div v-else-if="ctrl.type === 'threshold'" class="threshold-group">
          <input type="number" :value="ctrl.value" />
          <span class="threshold-unit">{{ ctrl.unit }}</span>
          <button class="btn-set" @click="$emit('command', { action: ctrl.key, value: ctrl.value })">设置</button>
        </div>
        <span v-if="ctrl.status" :class="['status-dot', ctrl.status]"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  controls: { type: Array, required: true },
  pending: { type: Boolean, default: false }
})

defineEmits(['command'])
</script>

<style scoped>
.control-panel {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
}
.control-title { font-size: var(--font-lg); margin-bottom: var(--space-md); }
.control-grid { display: flex; flex-direction: column; gap: var(--space-md); }
.control-item { display: flex; align-items: center; gap: var(--space-md); }
.control-label { font-size: var(--font-md); min-width: 100px; color: var(--color-text-secondary); }
.toggle-btn {
  padding: 6px 24px; border-radius: 20px; font-size: var(--font-sm);
  background: #e0e0e0; color: var(--color-text-secondary); transition: all 0.2s;
}
.toggle-btn.active { background: var(--color-success); color: #fff; }
.action-btn {
  padding: 6px 24px; background: var(--color-primary); color: #fff;
  border-radius: var(--radius-sm); font-size: var(--font-sm);
}
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.threshold-group { display: flex; align-items: center; gap: var(--space-sm); }
.threshold-group input {
  width: 80px; padding: 4px 8px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
}
.threshold-group input:focus { border-color: var(--color-primary); }
.threshold-unit { font-size: var(--font-sm); color: var(--color-text-secondary); }
.btn-set {
  padding: 4px 12px; background: var(--color-primary); color: #fff;
  border-radius: var(--radius-sm); font-size: var(--font-xs);
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.status-dot.online { background: var(--color-success); }
.status-dot.offline { background: var(--color-danger); }
</style>
