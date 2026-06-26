import request from './request'
import { generateFeederData, generateFeederHistory } from '../mock/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getFeederLatest() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(generateFeederData()), 300))
  }
  return request.get('/feeder/latest')
}

export function getFeederHistory(params = {}) {
  const { startTime, endTime, page = 1, pageSize = 20 } = params
  if (useMock) {
    return new Promise(resolve => {
      setTimeout(() => {
        const all = generateFeederHistory(100)
        const total = all.length
        const start = (page - 1) * pageSize
        resolve({ records: all.slice(start, start + pageSize), total, page, pageSize })
      }, 500)
    })
  }
  return request.get('/feeder/history', { params })
}

export function controlFeeder(command) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ code: 0, command }), 300))
  }
  return request.post('/feeder/control', command)
}
