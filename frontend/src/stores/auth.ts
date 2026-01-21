import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, clearSupabaseLocalStorage } from '../lib/supabase';
import router from '../router';
import { createLogger } from '../utils/logger';
import { api } from '../services/api';
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

/**
 * クロマキー背景タイプ
 */
export type ChromaKeyBackground = 'none' | 'green' | 'blue';

/**
 *
 */
export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  streamer_mode: boolean;
  theme_preference: string;
  is_admin: boolean;
  enable_screen_analysis: boolean;
  is_debugger: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null);
  const supabaseUser = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const isInitialized = ref(false);

  // ローカルストレージから配信者モード設定を読み込む
  const localStreamerMode = ref<boolean>(localStorage.getItem('streamerMode') === 'true');

  // ローカルストレージからクロマキー背景設定を読み込む
  const chromaKeyBackground = ref<ChromaKeyBackground>(
    (localStorage.getItem('chromaKeyBackground') as ChromaKeyBackground) || 'none',
  );

  const isAuthenticated = computed(() => !!user.value);
  const isDebugger = computed(() => user.value?.is_debugger ?? false);

  /**
   * プロフィール情報を取得
   * バックエンドAPI `/me` を使用してユーザー情報を取得
   * 注意: Supabase直接クエリではなくAPIを使用することでRLSの影響を回避
   */
  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await api.get<UserProfile>('/me');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch profile from API');
      return null;
    }
  };

  /**
   * タイムアウト付きPromiseラッパー
   * @param promise
   * @param timeoutMs
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
   * @param email
   * @param password
   * @param isRetry
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
      const profile = await fetchProfile();
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
          is_debugger: false,
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
   * @param provider
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
   * @param email
   * @param password
   * @param username
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
      const profile = await fetchProfile();
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
          is_debugger: false,
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
   * ローカルストレージとDBの両方に保存
   * @param enabled
   */
  const toggleStreamerMode = async (enabled: boolean) => {
    // ローカルストレージに即座に保存（オフライン対応）
    localStreamerMode.value = enabled;
    localStorage.setItem('streamerMode', enabled.toString());

    // ログイン中の場合はDBにも保存
    if (user.value) {
      try {
        const { error } = await supabase
          .from('users')
          // @ts-expect-error Supabase types don't match our schema exactly
          .update({ streamer_mode: enabled })
          .eq('supabase_uuid', user.value.id);

        if (error) {
          logger.warn('Failed to save streamer mode to DB:', error.message);
        } else {
          // ローカル状態も更新
          user.value = { ...user.value, streamer_mode: enabled };
        }
      } catch (error) {
        logger.warn('Failed to save streamer mode:', error);
      }
    }
  };

  // 配信者モードが有効かどうかを判定
  // ローカル設定またはDB設定のどちらかがtrueならtrue
  const isStreamerModeEnabled = computed(() => {
    return localStreamerMode.value || (user.value?.streamer_mode ?? false);
  });

  /**
   * クロマキー背景の設定
   * ローカルストレージにのみ保存（配信環境固有の設定のため）
   * @param background
   */
  const setChromaKeyBackground = (background: ChromaKeyBackground) => {
    chromaKeyBackground.value = background;
    localStorage.setItem('chromaKeyBackground', background);
    logger.debug('Chroma key background set to:', background);
  };

  /**
   * 現在のセッションを取得して認証状態を復元
   */
  const fetchUser = async () => {
    try {
      const startTime = performance.now();
      logger.debug('Fetching current session');

      // 10秒のタイムアウトを設定
      const getSessionStart = performance.now();
      const {
        data: { session: currentSession },
        error,
      } = await withTimeout(supabase.auth.getSession(), 10000);
      logger.debug(`getSession completed in ${(performance.now() - getSessionStart).toFixed(0)}ms`);

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

      // プロフィール取得にも10秒のタイムアウトを設定
      try {
        const profileStart = performance.now();
        const profile = await withTimeout(fetchProfile(), 10000);
        logger.debug(
          `fetchProfile completed in ${(performance.now() - profileStart).toFixed(0)}ms`,
        );
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
            is_debugger: false,
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
          is_debugger: false,
        };
      }

      isInitialized.value = true;
      logger.debug(`fetchUser total: ${(performance.now() - startTime).toFixed(0)}ms`);
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
   * @param email
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
   * @param newPassword
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
   * @param updates
   */
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id'>>) => {
    if (!user.value) {
      throw new Error('ログインしていません');
    }

    const { error } = await supabase
      .from('users')
      // @ts-expect-error Supabase types don't match our schema exactly
      .update(updates)
      .eq('supabase_uuid', user.value.id);

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
   *
   * 重要: onAuthStateChangeコールバックは同期的でなければならない。
   * Supabase SDKはnavigator.locksを使用しており、コールバック内で
   * supabase.from()やauth.getSession()などのSupabase APIを呼び出すと
   * 同じロックを取得しようとしてデッドロックが発生する。
   *
   * 解決策: プロフィール取得などのSupabase API呼び出しはqueueMicrotaskで
   * ロック解放後に遅延実行する。
   */
  const setupAuthListener = () => {
    try {
      supabase.auth.onAuthStateChange((event, newSession) => {
        logger.debug('Auth state changed:', event);

        if (event === 'SIGNED_IN' && newSession) {
          // 同期的に状態を更新（ロック保持中でも安全）
          supabaseUser.value = newSession.user;
          session.value = newSession;

          // 仮のユーザー情報を即座に設定（UIの応答性向上）
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
            is_debugger: false,
          };
          isInitialized.value = true;

          // プロフィール取得はロック解放後に遅延実行
          // queueMicrotaskでマイクロタスクキューに追加し、
          // 現在の同期処理（ロック保持中）が完了してから実行
          queueMicrotask(async () => {
            try {
              const profile = await fetchProfile();
              if (profile) {
                user.value = profile;
              }
            } catch (error) {
              logger.warn('Failed to fetch profile in auth listener:', error);
              // プロフィール取得失敗時は仮のユーザー情報を維持
            }
          });
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
    isDebugger,
    isStreamerModeEnabled,
    localStreamerMode,
    chromaKeyBackground,
    login,
    loginWithOAuth,
    register,
    logout,
    fetchUser,
    toggleStreamerMode,
    setChromaKeyBackground,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile,
    getAccessToken,
    setupAuthListener,
  };
});

/**
 * Supabase認証エラーメッセージを日本語に変換
 * @param message
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
