<template>
  <div class="filter-bar">
    <div class="filter-item" v-for="field in fields" :key="field.key">
      <label>{{ field.label }}</label>
      <select v-if="field.type === 'select'" :value="modelValue[field.key]"
        @change="onChange(field.key, $event.target.value)">
        <option value="">{{ field.placeholder || '全部' }}</option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input v-else-if="field.type === 'datetime-local'" type="datetime-local"
        :value="modelValue[field.key]" @input="onChange(field.key, $event.target.value)" />
      <input v-else :type="field.type || 'text'" :placeholder="field.placeholder"
        :value="modelValue[field.key]" @input="onChange(field.key, $event.target.value)" />
    </div>
    <div class="filter-actions">
      <button class="btn-search" @click="$emit('search')">查询</button>
      <button class="btn-reset" @click="$emit('reset')">重置</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fields: { type: Array, required: true },
  modelValue: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

function onChange(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style scoped>
.filter-bar {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--shadow-card);
  display: flex; flex-wrap: wrap; align-items: flex-end;
  gap: var(--space-md); margin-bottom: var(--space-md);
}
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.filter-item label { font-size: var(--font-xs); color: var(--color-text-secondary); }
.filter-item input, .filter-item select {
  padding: 6px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: var(--font-sm); min-width: 160px;
}
.filter-item input:focus, .filter-item select:focus { border-color: var(--color-primary); }
.filter-actions { display: flex; gap: var(--space-sm); }
.btn-search {
  padding: 7px 20px; background: var(--color-primary); color: #fff;
  border-radius: var(--radius-sm); font-size: var(--font-sm);
}
.btn-reset {
  padding: 7px 20px; background: var(--color-card);
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-sm); font-size: var(--font-sm);
}
</style>
