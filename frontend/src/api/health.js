import request from './request'
import { generateHealthData, generateHealthHistory } from '../mock/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getHealthLatest() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(generateHealthData()), 300))
  }
  return request.get('/health/latest')
}

export function getHealthHistory(params = {}) {
  const { startTime, endTime, page = 1, pageSize = 20 } = params
  if (useMock) {
    return new Promise(resolve => {
      setTimeout(() => {
        const all = generateHealthHistory(100)
        const total = all.length
        const start = (page - 1) * pageSize
        resolve({ records: all.slice(start, start + pageSize), total, page, pageSize })
      }, 500)
    })
  }
  return request.get('/health/history', { params })
}

export function controlHealth(command) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ code: 0, command }), 300))
  }
  return request.post('/health/control', command)
}
