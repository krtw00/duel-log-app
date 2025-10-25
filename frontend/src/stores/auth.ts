import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import router from '../router';
import type { AxiosError } from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{
    id: number;
    email: string;
    username: string;
    streamer_mode: boolean;
    theme_preference: string;
  } | null>(null);
  const isInitialized = ref(false);

  // ローカルストレージから配信者モード設定を読み込む
  const localStreamerMode = ref<boolean>(localStorage.getItem('streamerMode') === 'true');

  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    try {
      // ログインAPIをコール（成功するとサーバーがHttpOnlyクッキーを設定）
      const loginResponse = await api.post('/auth/login', { email, password });

      console.log('[Auth] Login response:', loginResponse.data);

      // OBS連携のため、すべてのブラウザでトークンをlocalStorageに保存
      if (loginResponse.data?.access_token) {
        console.log('[Auth] Saving token to localStorage for OBS integration');
        localStorage.setItem('access_token', loginResponse.data.access_token);
      }

      // Safari対応: ログインレスポンスから直接ユーザー情報を取得
      // これによりCookieのタイミング問題を回避
      if (loginResponse.data?.user) {
        user.value = loginResponse.data.user;
      }

      // 念のため、少し待ってからユーザー情報を再取得
      // Safari/iOSではCookie設定に若干の遅延がある場合がある
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ユーザー情報を取得してストアを更新
      await fetchUser();

      router.push('/');
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'ログインに失敗しました');
    }
  };

  const logout = async () => {
    try {
      // サーバーにログアウトを通知し、クッキーを削除させる
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Safari ITP対策: localStorageからトークンを削除
      localStorage.removeItem('access_token');

      // ローカルの状態をクリア（配信者モード設定は保持）
      user.value = null;
      isInitialized.value = false; // ログアウト後に未初期化状態に戻す
      router.push('/login');
    }
  };

  const toggleStreamerMode = (enabled: boolean) => {
    localStreamerMode.value = enabled;
    localStorage.setItem('streamerMode', enabled.toString());
  };

  // 配信者モードが有効かどうかを判定（ログイン中はユーザー設定、未ログイン時はローカル設定）
  const isStreamerModeEnabled = computed(() => {
    return user.value ? user.value.streamer_mode : localStreamerMode.value;
  });

  const fetchUser = async () => {
    try {
      console.log('[Auth] Fetching user info from /me');
      // /meエンドポイントにアクセス（ブラウザがクッキーを自動送信）
      const response = await api.get('/me');
      console.log('[Auth] User info fetched successfully:', response.data);
      user.value = response.data;
    } catch (error) {
      // エラー（クッキーがない、または無効）の場合はユーザー情報をクリア
      console.error('[Auth] Failed to fetch user info:', error);
      user.value = null;
    } finally {
      isInitialized.value = true;
    }
  };

  return {
    user,
    isInitialized,
    isAuthenticated,
    isStreamerModeEnabled,
    localStreamerMode,
    login,
    logout,
    fetchUser,
    toggleStreamerMode,
  };
});
