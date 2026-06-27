import request from './request'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function login(username, password) {
  if (useMock) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (username === 'admin' && password === '123456') {
          resolve({ token: 'mock-jwt-token-2026', user: { id: 1, name: '管理员', role: 'admin' } })
        } else {
          resolve({ code: 401, message: '用户名或密码错误' })
        }
      }, 500)
    })
  }
  return request.post('/login', { username, password })
}

export function logout() {
  if (useMock) {
    return Promise.resolve({ code: 0 })
  }
  return request.post('/logout')
}
