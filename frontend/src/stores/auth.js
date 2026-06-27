import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    loading.value = true
    error.value = ''
    try {
      const res = await loginApi(username, password)
      if (res.code === 401) {
        error.value = res.message
        return false
      }
      token.value = res.token
      userInfo.value = res.user
      localStorage.setItem('token', res.token)
      localStorage.setItem('userInfo', JSON.stringify(res.user))
      return true
    } catch (e) {
      error.value = '登录失败，请稍后重试'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    logoutApi()
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, loading, error, isLoggedIn, login, logout }
})
