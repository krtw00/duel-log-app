import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import { clearAccessToken, setAccessToken } from '../services/authTokens';
import router from '../router';
import type { AxiosError } from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('Auth');

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{
    id: number;
    email: string;
    username: string;
    streamer_mode: boolean;
    theme_preference: string;
    is_admin: boolean;
  } | null>(null);
  const isInitialized = ref(false);

  // ローカルストレージから配信者モード設定を読み込む
  const localStreamerMode = ref<boolean>(localStorage.getItem('streamerMode') === 'true');

  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    try {
      // ログインAPIをコール（成功するとサーバーがHttpOnlyクッキーを設定）
      const loginResponse = await api.post('/auth/login', { email, password });

      logger.debug('Login response received');

      // 想定外のレスポンスの場合は「ログイン成功」と扱わない
      if (!loginResponse.data?.user) {
        throw new Error('ログインレスポンスが不正です');
      }

      // OBS連携のため、すべてのブラウザでトークンをlocalStorageに保存
      if (loginResponse.data?.access_token) {
        logger.debug('Saving token to localStorage for OBS integration');
        setAccessToken(loginResponse.data.access_token);
      }

      // ログインレスポンスから直接ユーザー情報を取得して設定
      // サーバーが返したユーザー情報は既に検証済みなので、これを信頼して使用
      logger.debug('Setting user from login response');
      user.value = loginResponse.data.user;
      isInitialized.value = true;
      logger.debug('User state is now authenticated');

      logger.info('Login successful, navigating to dashboard');
      // ナビゲーション前に少し待機（Safari/iOS Cookie設定遅延対応）
      await new Promise((resolve) => setTimeout(resolve, 100));
      await router.push('/');
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      logger.error('Login failed:', axiosError.response?.data?.detail || 'Unknown error');
      user.value = null;
      isInitialized.value = true;
      clearAccessToken();
      throw new Error(axiosError.response?.data?.detail || 'ログインに失敗しました');
    }
  };

  const logout = async () => {
    try {
      // 1. サーバーにログアウトを通知する
      await api.post('/auth/logout');
      logger.debug('Logout API call successful');
    } catch (error) {
      // API呼び出しが失敗した場合でも、エラーをログに記録し、
      // クライアント側のログアウト処理を続行する
      logger.warn('Logout API call failed, proceeding with client-side cleanup');
    } finally {
      // 2. 確実にクライアント側の状態をクリアする
      user.value = null;
      isInitialized.value = true; // ログアウト状態も「初期化済み」として扱う
      clearAccessToken(); // OBS連携用のトークンを削除
      sessionStorage.clear(); // セッションストレージもクリア

      // 3. 最後にログインページにリダイレクトする
      // router.pushではVue Routerの状態が残る可能性があるため、
      // window.location.assignでページを完全に再読み込みさせる
      window.location.assign('/login');
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
      logger.debug('Fetching user info from /me');
      // /meエンドポイントにアクセス（ブラウザがクッキーを自動送信）
      const response = await api.get('/me');
      logger.debug('User info fetched successfully');
      const data = response.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid /me response');
      }
      user.value = data as any;
      isInitialized.value = true;
    } catch (error) {
      // エラー（クッキーがない、または無効）の場合はユーザー情報をクリア
      logger.debug('Failed to fetch user info (not authenticated)');
      user.value = null;
      isInitialized.value = true;
      clearAccessToken();
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
