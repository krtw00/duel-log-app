import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, clearSupabaseLocalStorage } from '../lib/supabase';
import router from '../router';
import { createLogger } from '../utils/logger';
import type { User, Session, Provider } from '@supabase/supabase-js';

const logger = createLogger('Auth');

const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

const normalizeApiBase = (raw: string) =>
  raw.trim().replace('://localhost', '://127.0.0.1').replace(/\/+$/, '');

const clearLegacyBackendCookie = async () => {
  const rawBase = import.meta.env.VITE_API_URL ?? '/api';
  const base = normalizeApiBase(rawBase);
  const url = joinUrl(base, '/auth/logout');

  try {
    await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.debug('Failed to clear legacy backend cookie:', error);
  }
};

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  streamer_mode: boolean;
  theme_preference: string;
  is_admin: boolean;
  enable_screen_analysis: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null);
  const supabaseUser = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const isInitialized = ref(false);

  // ローカルストレージから配信者モード設定を読み込む
  const localStreamerMode = ref<boolean>(localStorage.getItem('streamerMode') === 'true');

  const isAuthenticated = computed(() => !!user.value);

  /**
   * プロフィール情報を取得
   */
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
      logger.error('Failed to fetch profile:', error.message);
      return null;
    }

    return data as unknown as UserProfile;
  };

  /**
   * タイムアウト付きPromiseラッパー
   */
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  };

  /**
   * メール/パスワードでログイン
   * タイムアウト時は古いセッションデータをクリアして自動リトライ
   */
  const login = async (email: string, password: string, isRetry = false) => {
    try {
      logger.debug('Attempting login with email/password', { isRetry });

      // 初回ログイン時は、古いセッションが残っている可能性があるのでクリアする
      if (!isRetry) {
        try {
          // ローカルスコープでサインアウト（サーバーには通知しない）
          await withTimeout(supabase.auth.signOut({ scope: 'local' }), 2000);
        } catch {
          // サインアウトに失敗しても続行
          logger.debug('Pre-login signOut failed or timed out, continuing...');
        }
        // ローカルストレージもクリア
        clearSupabaseLocalStorage();
        // 少し待ってからログインを試行
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 8秒のタイムアウトを設定（古いセッションデータによるハングを防ぐ）
      let data;
      let error;
      try {
        const result = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          8000,
        );
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        // タイムアウトした場合、さらにストレージをクリアしてリトライ
        if (!isRetry && timeoutError instanceof Error && timeoutError.message.includes('Timeout')) {
          logger.warn('Login timed out after pre-cleanup, retrying with fresh state...');
          clearSupabaseLocalStorage();
          sessionStorage.clear();
          await new Promise((resolve) => setTimeout(resolve, 200));
          return login(email, password, true);
        }
        throw timeoutError;
      }

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('ログインレスポンスが不正です');
      }

      logger.debug('Login successful, fetching profile');
      supabaseUser.value = data.user;
      session.value = data.session;

      // 旧バックエンド認証の HttpOnly Cookie が残っていると、
      // Authorization が付与されないケースで 401→強制ログアウトになるため、ここで削除しておく。
      await clearLegacyBackendCookie();

      // プロフィール情報を取得
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        user.value = profile;
      } else {
        // プロフィールがない場合は user_metadata から作成
        user.value = {
          id: data.user.id,
          email: data.user.email || null,
          username:
            data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'ユーザー',
          streamer_mode: false,
          theme_preference: 'dark',
          is_admin: false,
          enable_screen_analysis: false,
        };
      }

      isInitialized.value = true;
      logger.info('Login successful, navigating to dashboard');

      await router.push('/');
    } catch (error) {
      logger.error('Login failed:', error);
      user.value = null;
      supabaseUser.value = null;
      session.value = null;
      isInitialized.value = true;

      if (error instanceof Error) {
        // Supabaseのエラーメッセージを日本語に変換
        const message = translateAuthError(error.message);
        throw new Error(message);
      }
      throw error;
    }
  };

  /**
   * OAuth プロバイダーでログイン
   */
  const loginWithOAuth = async (provider: Provider) => {
    try {
      logger.debug(`Attempting OAuth login with ${provider}`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // OAuth はリダイレクトするので、ここでは何もしない
    } catch (error) {
      logger.error('OAuth login failed:', error);
      if (error instanceof Error) {
        throw new Error(translateAuthError(error.message));
      }
      throw error;
    }
  };

  /**
   * 新規登録
   */
  const register = async (email: string, password: string, username: string) => {
    try {
      logger.debug('Attempting registration');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('登録レスポンスが不正です');
      }

      // メール確認が必要な場合
      if (!data.session) {
        logger.info('Registration successful, email confirmation required');
        return { requiresConfirmation: true };
      }

      logger.debug('Registration successful, fetching profile');
      supabaseUser.value = data.user;
      session.value = data.session;

      // プロフィール情報を取得（トリガーで作成されているはず）
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        user.value = profile;
      } else {
        user.value = {
          id: data.user.id,
          email: data.user.email || null,
          username,
          streamer_mode: false,
          theme_preference: 'dark',
          is_admin: false,
          enable_screen_analysis: false,
        };
      }

      isInitialized.value = true;
      await router.push('/');

      return { requiresConfirmation: false };
    } catch (error) {
      logger.error('Registration failed:', error);
      if (error instanceof Error) {
        throw new Error(translateAuthError(error.message));
      }
      throw error;
    }
  };

  /**
   * ログアウト
   */
  const logout = async () => {
    try {
      logger.debug('Logging out');
      await clearLegacyBackendCookie();
      // scope: 'global' で全てのセッション（他デバイス含む）からサインアウト
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      logger.warn('Logout API call failed, proceeding with client-side cleanup:', error);
    } finally {
      user.value = null;
      supabaseUser.value = null;
      session.value = null;
      isInitialized.value = true;
      sessionStorage.clear();

      // Supabaseのセッションデータを確実にクリア（signOutが失敗した場合の保険）
      try {
        const supabaseKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('sb-') || key.includes('supabase'),
        );
        supabaseKeys.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        logger.debug('Failed to clear localStorage:', e);
      }

      window.location.assign('/login');
    }
  };

  /**
   * 配信者モードの切り替え
   */
  const toggleStreamerMode = (enabled: boolean) => {
    localStreamerMode.value = enabled;
    localStorage.setItem('streamerMode', enabled.toString());
  };

  // 配信者モードが有効かどうかを判定
  const isStreamerModeEnabled = computed(() => {
    return user.value ? user.value.streamer_mode : localStreamerMode.value;
  });

  /**
   * 現在のセッションを取得して認証状態を復元
   */
  const fetchUser = async () => {
    try {
      logger.debug('Fetching current session');

      // 5秒のタイムアウトを設定（ネットワーク問題でのハングを防ぐ）
      const {
        data: { session: currentSession },
        error,
      } = await withTimeout(supabase.auth.getSession(), 5000);

      if (error) {
        throw error;
      }

      if (!currentSession) {
        logger.debug('No active session');
        user.value = null;
        supabaseUser.value = null;
        session.value = null;
        isInitialized.value = true;
        return;
      }

      logger.debug('Session found, fetching profile');
      supabaseUser.value = currentSession.user;
      session.value = currentSession;

      // プロフィール取得にも3秒のタイムアウトを設定
      try {
        const profile = await withTimeout(fetchProfile(currentSession.user.id), 3000);
        if (profile) {
          user.value = profile;
        } else {
          user.value = {
            id: currentSession.user.id,
            email: currentSession.user.email || null,
            username:
              currentSession.user.user_metadata?.username ||
              currentSession.user.email?.split('@')[0] ||
              'ユーザー',
            streamer_mode: false,
            theme_preference: 'dark',
            is_admin: false,
            enable_screen_analysis: false,
          };
        }
      } catch (profileError) {
        logger.warn('Profile fetch failed or timed out, using metadata:', profileError);
        user.value = {
          id: currentSession.user.id,
          email: currentSession.user.email || null,
          username:
            currentSession.user.user_metadata?.username ||
            currentSession.user.email?.split('@')[0] ||
            'ユーザー',
          streamer_mode: false,
          theme_preference: 'dark',
          is_admin: false,
          enable_screen_analysis: false,
        };
      }

      isInitialized.value = true;
    } catch (error) {
      logger.debug('Failed to fetch session:', error);
      user.value = null;
      supabaseUser.value = null;
      session.value = null;
      isInitialized.value = true;
    }
  };

  /**
   * パスワードリセットメール送信
   */
  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  };

  /**
   * パスワード更新
   */
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(translateAuthError(error.message));
    }
  };

  /**
   * プロフィール更新
   */
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id'>>) => {
    if (!user.value) {
      throw new Error('ログインしていません');
    }

    const { error } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase types don't match our schema exactly
      .update(updates)
      .eq('id', user.value.id);

    if (error) {
      throw new Error(error.message);
    }

    // ローカル状態を更新
    user.value = { ...user.value, ...updates };
  };

  /**
   * アクセストークンを取得（API呼び出し用）
   */
  const getAccessToken = async (): Promise<string | null> => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    return currentSession?.access_token || null;
  };

  /**
   * 認証状態の変更を監視
   */
  const setupAuthListener = () => {
    try {
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        logger.debug('Auth state changed:', event);

        if (event === 'SIGNED_IN' && newSession) {
          supabaseUser.value = newSession.user;
          session.value = newSession;

          const profile = await fetchProfile(newSession.user.id);
          if (profile) {
            user.value = profile;
          } else {
            user.value = {
              id: newSession.user.id,
              email: newSession.user.email || null,
              username:
                newSession.user.user_metadata?.username ||
                newSession.user.email?.split('@')[0] ||
                'ユーザー',
              streamer_mode: false,
              theme_preference: 'dark',
              is_admin: false,
              enable_screen_analysis: false,
            };
          }
          isInitialized.value = true;
        } else if (event === 'SIGNED_OUT') {
          user.value = null;
          supabaseUser.value = null;
          session.value = null;
          isInitialized.value = true;
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          session.value = newSession;
        }
      });
    } catch (error) {
      logger.warn('Failed to setup auth listener:', error);
      isInitialized.value = true;
    }
  };

  return {
    user,
    supabaseUser,
    session,
    isInitialized,
    isAuthenticated,
    isStreamerModeEnabled,
    localStreamerMode,
    login,
    loginWithOAuth,
    register,
    logout,
    fetchUser,
    toggleStreamerMode,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile,
    getAccessToken,
    setupAuthListener,
  };
});

/**
 * Supabase認証エラーメッセージを日本語に変換
 */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスが確認されていません。確認メールをご確認ください',
    'User already registered': 'このメールアドレスは既に登録されています',
    'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
    'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません',
    'Signup requires a valid password': '有効なパスワードを入力してください',
    'Email rate limit exceeded': 'メール送信の制限に達しました。しばらくしてからお試しください',
    'For security purposes, you can only request this once every 60 seconds':
      'セキュリティのため、60秒に1回のみリクエストできます',
  };

  return translations[message] || message;
}
