<template>
  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length" class="empty-row">暂无数据</td>
        </tr>
        <tr v-for="(row, ri) in data" :key="ri">
          <td v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="$emit('pageChange', page - 1)">上一页</button>
      <span>第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页（共 {{ total }} 条）</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="$emit('pageChange', page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 }
})

defineEmits(['pageChange'])
</script>

<style scoped>
.data-table-wrapper {
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  overflow: auto;
}
.data-table { width: 100%; border-collapse: collapse; font-size: var(--font-sm); }
.data-table th {
  background: #fafafa;
  padding: 12px var(--space-md);
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
}
.data-table td {
  padding: 10px var(--space-md);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.data-table tr:hover td { background: #fafafa; }
.empty-row { text-align: center; color: var(--color-text-secondary); padding: 40px !important; }
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: var(--space-md); padding: var(--space-md);
}
.pagination button {
  padding: 6px 16px; border: 1px solid var(--color-border);
  background: var(--color-card); border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination button:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.pagination span { font-size: var(--font-sm); color: var(--color-text-secondary); }
</style>
