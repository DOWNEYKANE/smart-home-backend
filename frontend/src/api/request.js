import axios from 'axios'

// VITE_USE_MOCK=false 时使用真实后端地址
const apiBase = import.meta.env.VITE_USE_MOCK === 'true'
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || '/api')

const instance = axios.create({
  baseURL: apiBase,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance
