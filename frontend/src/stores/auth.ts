import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: number; email: string; username: string; streamer_mode: boolean } | null>(null)
  const isInitialized = ref(false)
  
  // ローカルストレージから配信者モード設定を読み込む
  const localStreamerMode = ref<boolean>(localStorage.getItem('streamerMode') === 'true')

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
      // ローカルの状態をクリア（配信者モード設定は保持）
      user.value = null
      isInitialized.value = true // ログアウト後も初期化済み
      router.push('/login')
    }
  }
  
  const toggleStreamerMode = (enabled: boolean) => {
    localStreamerMode.value = enabled
    localStorage.setItem('streamerMode', enabled.toString())
  }
  
  // 配信者モードが有効かどうかを判定（ログイン中はユーザー設定、未ログイン時はローカル設定）
  const isStreamerModeEnabled = computed(() => {
    return user.value ? user.value.streamer_mode : localStreamerMode.value
  })

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
    isStreamerModeEnabled,
    localStreamerMode,
    login,
    logout,
    fetchUser,
    toggleStreamerMode
  }
})
