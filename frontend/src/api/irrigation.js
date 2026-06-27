import request from './request'
import { generateIrrigationData, generateIrrigationHistory } from '../mock/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getIrrigationLatest() {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve(generateIrrigationData()), 300))
  }
  return request.get('/irrigation/latest')
}

export function getIrrigationHistory(params = {}) {
  const { startTime, endTime, page = 1, pageSize = 20 } = params
  if (useMock) {
    return new Promise(resolve => {
      setTimeout(() => {
        const all = generateIrrigationHistory(100)
        const total = all.length
        const start = (page - 1) * pageSize
        resolve({ records: all.slice(start, start + pageSize), total, page, pageSize })
      }, 500)
    })
  }
  return request.get('/irrigation/history', { params })
}

export function controlIrrigation(command) {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({ code: 0, command }), 300))
  }
  return request.post('/irrigation/control', command)
}
