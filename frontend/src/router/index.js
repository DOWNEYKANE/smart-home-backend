import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { noAuth: true }
  },
  {
    path: '/',
    component: () => import('../views/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardPage.vue') },
      { path: 'environment', name: 'Environment', component: () => import('../views/EnvironmentPage.vue') },
      { path: 'health', name: 'Health', component: () => import('../views/HealthPage.vue') },
      { path: 'irrigation', name: 'Irrigation', component: () => import('../views/IrrigationPage.vue') },
      { path: 'feeder', name: 'Feeder', component: () => import('../views/FeederPage.vue') },
      { path: 'history', name: 'History', component: () => import('../views/HistoryPage.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (!to.meta.noAuth && !token) {
    return '/login'
  }
  if (to.path === '/login' && token) {
    return '/dashboard'
  }
})

export default router
