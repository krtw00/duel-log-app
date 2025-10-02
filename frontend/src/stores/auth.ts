import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: number; email: string; username: string } | null>(null)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string) => {
    try {
      // ログインAPIをコール（成功するとサーバーがHttpOnlyクッキーを設定）
      await api.post('/auth/login', { email, password })
      
      // ユーザー情報を取得してストアを更新
      await fetchUser()
      
      router.push('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'ログインに失敗しました')
    }
  }

  const logout = async () => {
    try {
      // サーバーにログアウトを通知し、クッキーを削除させる
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // ローカルの状態をクリア
      user.value = null
      isInitialized.value = true // ログアウト後も初期化済み
      router.push('/login')
    }
  }

  const fetchUser = async () => {
    try {
      // /meエンドポイントにアクセス（ブラウザがクッキーを自動送信）
      const response = await api.get('/me')
      user.value = response.data
    } catch (error) {
      // エラー（クッキーがない、または無効）の場合はユーザー情報をクリア
      user.value = null
    } finally {
      isInitialized.value = true
    }
  }

  return {
    user,
    isInitialized,
    isAuthenticated,
    login,
    logout,
    fetchUser
  }
})
