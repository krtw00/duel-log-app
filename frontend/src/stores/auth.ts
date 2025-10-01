import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<{ id: number; email: string; username: string } | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      token.value = response.data.access_token
      localStorage.setItem('token', response.data.access_token)
      
      // ユーザー情報を取得
      await fetchUser()
      
      router.push('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'ログインに失敗しました')
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    router.push('/login')
  }

  const fetchUser = async () => {
    try {
      const response = await api.get('/me')
      user.value = response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  // 初期化時にユーザー情報を取得
  if (token.value) {
    fetchUser()
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser
  }
})
