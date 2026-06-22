<template>
  <nav :class="['side-menu', { 'mobile-open': mobileOpen }]">
    <router-link
      v-for="item in menuItems"
      :key="item.path"
      :to="item.path"
      class="menu-item"
      :class="{ active: isActive(item.path) }"
      @click="$emit('navigate')"
    >
      <span class="menu-icon">{{ item.icon }}</span>
      <span class="menu-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineProps({
  mobileOpen: { type: Boolean, default: false }
})

defineEmits(['navigate'])

const route = useRoute()

const menuItems = [
  { path: '/dashboard', icon: '📊', label: '仪表盘' },
  { path: '/environment', icon: '🌡️', label: '环境监控' },
  { path: '/health', icon: '❤️', label: '心脏健康' },
  { path: '/irrigation', icon: '🌿', label: '智能浇灌' },
  { path: '/feeder', icon: '🐾', label: '宠物喂食' },
  { path: '/history', icon: '📋', label: '历史记录' },
]

function isActive(path) {
  return route.path === path
}
</script>

<style scoped>
.side-menu {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  padding: var(--space-sm) 0;
  overflow-y: auto;
  z-index: 90;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px var(--space-lg);
  color: var(--color-sidebar-text);
  font-size: var(--font-md);
  transition: all 0.15s;
  border-left: 3px solid transparent;
  text-decoration: none;
}
.menu-item:hover { background: #f5f5f5; color: var(--color-primary); }
.menu-item.active {
  background: var(--color-sidebar-active);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 500;
}
.menu-icon { font-size: 18px; }

@media (max-width: 768px) {
  .side-menu {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    transform: translateX(-100%);
    transition: transform 0.25s;
    z-index: 200;
    padding-top: var(--header-height);
  }
  .side-menu.mobile-open { transform: translateX(0); }
}
</style>
