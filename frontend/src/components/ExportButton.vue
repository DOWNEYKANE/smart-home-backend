<template>
  <button class="export-btn" @click="handleExport" :disabled="disabled">
    📥 {{ label }}
  </button>
</template>

<script setup>
import * as XLSX from 'xlsx'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  filename: { type: String, default: 'export' },
  label: { type: String, default: '导出 Excel' },
  disabled: { type: Boolean, default: false }
})

function handleExport() {
  if (props.data.length === 0) return
  const headers = props.columns.map(c => c.title)
  const keys = props.columns.map(c => c.key)
  const rows = props.data.map(row => keys.map(k => row[k] ?? ''))
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1')
  XLSX.writeFile(wb, `${props.filename}.xlsx`)
}
</script>

<style scoped>
.export-btn {
  padding: 7px 20px;
  background: var(--color-success);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}
.export-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
