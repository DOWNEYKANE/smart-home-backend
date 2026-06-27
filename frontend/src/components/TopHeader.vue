<template>
  <header class="top-header">
    <div class="header-left">
      <button class="menu-toggle" @click="$emit('toggleMenu')">☰</button>
      <h1 class="header-logo">🏠 智能家居管理系统</h1>
    </div>
    <div class="header-right">
      <span class="device-summary">
        <span class="online-count">{{ onlineCount }}</span> / {{ totalCount }} 设备在线
      </span>
      <span class="user-name">{{ auth.userInfo?.name }}</span>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDeviceStore } from '../stores/device'

const router = useRouter()
const auth = useAuthStore()
const device = useDeviceStore()

defineEmits(['toggleMenu'])

const onlineCount = computed(() => {
  return [device.environment, device.health, device.irrigation, device.feeder]
    .filter(d => d?.deviceStatus === 'online').length
})
const totalCount = 4

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.top-header {
  height: var(--header-height);
  background: var(--color-header-bg);
  color: var(--color-header-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  box-shadow: var(--shadow-header);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.header-left { display: flex; align-items: center; gap: var(--space-md); }
.menu-toggle {
  display: none;
  font-size: 20px;
  background: none;
  color: #fff;
  padding: 4px;
}
.header-logo { font-size: var(--font-lg); font-weight: 600; }
.header-right { display: flex; align-items: center; gap: var(--space-lg); }
.device-summary { font-size: var(--font-xs); color: rgba(255,255,255,0.7); }
.online-count { color: var(--color-success); font-weight: 600; }
.user-name { font-size: var(--font-sm); }
.logout-btn {
  padding: 4px 16px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}
.logout-btn:hover { background: rgba(255,255,255,0.25); }

@media (max-width: 768px) {
  .menu-toggle { display: block; }
  .header-logo { font-size: var(--font-md); }
  .device-summary, .user-name { display: none; }
}
</style>
