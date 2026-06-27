import request from './request'
import { generateEnvironmentData, generateEnvironmentHistory } from '../mock/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getEnvironmentLatest() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(generateEnvironmentData()), 300))
  }
  return request.get('/environment/latest')
}

export function getEnvironmentHistory(params = {}) {
  const { startTime, endTime, page = 1, pageSize = 20 } = params
  if (useMock) {
    return new Promise(resolve => {
      setTimeout(() => {
        const all = generateEnvironmentHistory(100)
        const total = all.length
        const start = (page - 1) * pageSize
        resolve({ records: all.slice(start, start + pageSize), total, page, pageSize })
      }, 500)
    })
  }
  return request.get('/environment/history', { params })
}

export function controlEnvironment(command) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ code: 0, command }), 300))
  }
  return request.post('/environment/control', command)
}
