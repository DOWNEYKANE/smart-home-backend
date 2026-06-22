<template>
  <div class="main-layout">
    <TopHeader @toggleMenu="mobileMenuOpen = !mobileMenuOpen" />
    <div class="layout-body">
      <SideMenu :mobileOpen="mobileMenuOpen" @navigate="mobileMenuOpen = false" />
      <div class="menu-overlay" :class="{ visible: mobileMenuOpen }" @click="mobileMenuOpen = false"></div>
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <nav class="mobile-tabs">
      <router-link
        v-for="item in mobileTabs"
        :key="item.path"
        :to="item.path"
        class="tab-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="tab-icon">{{ item.icon }}</span>
        <span class="tab-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import TopHeader from '../components/TopHeader.vue'
import SideMenu from '../components/SideMenu.vue'

const route = useRoute()
const mobileMenuOpen = ref(false)

const mobileTabs = [
  { path: '/dashboard', icon: '📊', label: '总览' },
  { path: '/environment', icon: '🌡️', label: '环境' },
  { path: '/health', icon: '❤️', label: '健康' },
  { path: '/irrigation', icon: '🌿', label: '浇灌' },
  { path: '/feeder', icon: '🐾', label: '喂食' },
]
</script>

<style scoped>
.main-layout { min-height: 100vh; }
.layout-body { display: flex; padding-top: var(--header-height); }
.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  min-height: calc(100vh - var(--header-height));
  padding: var(--space-lg);
}
.menu-overlay { display: none; }
.mobile-tabs { display: none; }

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: var(--space-md);
    padding-bottom: calc(var(--mobile-tab-height) + var(--space-md));
  }
  .menu-overlay.visible { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
  .mobile-tabs {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: var(--mobile-tab-height);
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
    z-index: 100;
    justify-content: space-around;
    align-items: center;
  }
  .tab-item {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px; font-size: var(--font-xs); color: var(--color-text-secondary);
    padding: 4px 0; text-decoration: none;
  }
  .tab-item.active { color: var(--color-primary); }
  .tab-icon { font-size: 20px; }
  .tab-label { font-size: 10px; }
}
</style>
