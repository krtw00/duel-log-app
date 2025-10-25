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
    // 1. 最初にクライアント側の状態を完全にクリアする
    user.value = null;
    isInitialized.value = true; // ログアウト状態も「初期化済み」として扱う
    localStorage.removeItem('access_token'); // OBS連携用のトークンを削除
    sessionStorage.clear(); // セッションストレージも念のためクリア

    try {
      // 1. 最初にサーバーにログアウトを通知する
      await api.post('/auth/logout');
      console.log('[Auth] Logout API call successful.');
    } catch (error) {
      // API呼び出しが失敗した場合でも、エラーをログに記録し、
      // クライアント側のログアウト処理を続行する
      console.error('Logout API call failed, proceeding with client-side cleanup:', error);
    }

    // 2. サーバーへの通知後、クライアント側の状態を完全にクリアする
    user.value = null;
    isInitialized.value = true; // ログアウトは「未初期化」ではなく「認証済みでない」状態
    localStorage.removeItem('access_token');
    // 他のセッション関連データもここでクリア
    sessionStorage.clear();

    // 3. 最後にログインページにリダイレクトする
    // router.pushではVue Routerの状態が残る可能性があるため、
    // window.location.assignでページを完全に再読み込みさせる
    window.location.assign('/login');
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
