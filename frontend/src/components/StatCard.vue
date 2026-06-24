<template>
  <div class="stat-card" :style="{ borderTopColor: color }">
    <div class="stat-card-icon" :style="{ color }">{{ icon }}</div>
    <div class="stat-card-body">
      <div class="stat-card-title">{{ title }}</div>
      <div class="stat-card-value">
        <span class="value">{{ value ?? '--' }}</span>
        <span class="unit" v-if="unit">{{ unit }}</span>
      </div>
      <div class="stat-card-trend" v-if="trend" :class="trend > 0 ? 'up' : 'down'">
        {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}{{ unit || '%' }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], default: null },
  unit: { type: String, default: '' },
  icon: { type: String, default: '📊' },
  color: { type: String, default: 'var(--color-primary)' },
  trend: { type: Number, default: null }
})
</script>

<style scoped>
.stat-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
  border-top: 3px solid;
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
.stat-card-icon { font-size: 32px; line-height: 1; }
.stat-card-body { flex: 1; min-width: 0; }
.stat-card-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}
.stat-card-value { display: flex; align-items: baseline; gap: 4px; }
.stat-card-value .value { font-size: var(--font-xxl); font-weight: 600; }
.stat-card-value .unit { font-size: var(--font-sm); color: var(--color-text-secondary); }
.stat-card-trend { font-size: var(--font-xs); margin-top: var(--space-xs); }
.stat-card-trend.up { color: var(--color-danger); }
.stat-card-trend.down { color: var(--color-success); }
</style>
