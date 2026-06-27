<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>🏠</h1>
        <h2>智能家居管理系统</h2>
        <p>请登录您的账号</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-item">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <p class="login-error" v-if="auth.error">{{ auth.error }}</p>
        <button type="submit" class="login-btn" :disabled="auth.loading">
          {{ auth.loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      <p class="login-hint">默认账号：admin / 123456</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')

async function handleLogin() {
  if (!username.value || !password.value) return
  const ok = await auth.login(username.value, password.value)
  if (ok) router.replace('/dashboard')
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: var(--color-card);
  border-radius: 12px;
  padding: 48px 40px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.login-header { text-align: center; margin-bottom: 32px; }
.login-header h1 { font-size: 48px; margin-bottom: var(--space-md); }
.login-header h2 { font-size: var(--font-xl); margin-bottom: var(--space-xs); }
.login-header p { font-size: var(--font-sm); color: var(--color-text-secondary); }
.login-form { display: flex; flex-direction: column; gap: var(--space-lg); }
.form-item { display: flex; flex-direction: column; gap: 6px; }
.form-item label { font-size: var(--font-sm); font-weight: 500; }
.form-item input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
  transition: border-color 0.2s;
}
.form-item input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light); }
.login-error { color: var(--color-danger); font-size: var(--font-sm); text-align: center; }
.login-btn {
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--font-lg);
  font-weight: 500;
  transition: background 0.2s;
}
.login-btn:hover:not(:disabled) { background: #1677ff; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.login-hint { margin-top: var(--space-lg); text-align: center; font-size: var(--font-xs); color: var(--color-text-secondary); }
</style>
