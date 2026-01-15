<template>
  <div class="callback-container">
    <v-progress-circular indeterminate size="64" color="primary" />
    <p class="mt-4 text-grey">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const statusMessage = ref('認証中...');

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
 * URLからエラーパラメータを取得
 */
const getErrorParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  return {
    error: searchParams.get('error') || hashParams.get('error'),
    errorDescription:
      searchParams.get('error_description') || hashParams.get('error_description'),
    errorCode: searchParams.get('error_code') || hashParams.get('error_code'),
  };
};

/**
 * URLから認証パラメータを取得（デバッグ用）
 */
const checkUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  const params = {
    code: searchParams.get('code') || hashParams.get('code'),
    access_token: searchParams.get('access_token') || hashParams.get('access_token'),
    refresh_token: searchParams.get('refresh_token') || hashParams.get('refresh_token'),
    error: searchParams.get('error') || hashParams.get('error'),
    error_description: searchParams.get('error_description') || hashParams.get('error_description'),
  };
  
  console.log('[AuthCallback] URL parameters:', params);
  return params;
};

/**
 * セッションを待機（detectSessionInUrl: true が処理するのを待つ）
 * Supabaseが自動でURLから認証パラメータを検出・処理する
 * onAuthStateChangeイベントを使用してより効率的にセッション確立を検知
 */
const waitForSession = async (timeoutMs = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    let resolved = false;
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[AuthCallback] Session wait timeout after', timeoutMs, 'ms');
        if (subscription) {
          subscription.unsubscribe();
        }
        resolve(false);
      }
    }, timeoutMs);

    // SupabaseがURLを処理する時間を与えるため、少し待ってからセッションを確認
    // PKCEフローでは、detectSessionInUrlが自動的にcodeを処理するが、非同期で行われる
    setTimeout(() => {
      // まず現在のセッションを確認
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.warn('[AuthCallback] getSession error:', error);
        }

        if (data?.session && !resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          console.log('[AuthCallback] Session already exists');
          resolve(true);
          return;
        }

        // セッションがない場合、onAuthStateChangeで待機
        console.log('[AuthCallback] Waiting for session via onAuthStateChange...');
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`[AuthCallback] Auth state changed: ${event}`, session ? 'has session' : 'no session');
          
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            if (sub) {
              sub.unsubscribe();
            }
            console.log(`[AuthCallback] Session established via ${event} event`);
            resolve(true);
          } else if (event === 'TOKEN_REFRESHED' && session && !resolved) {
            // 既にセッションがある場合のトークンリフレッシュ
            resolved = true;
            clearTimeout(timeoutId);
            if (sub) {
              sub.unsubscribe();
            }
            console.log('[AuthCallback] Session refreshed');
            resolve(true);
          }
        });

        subscription = sub;

        // 定期的にセッションを確認（フォールバック）
        const checkInterval = setInterval(() => {
          if (resolved) {
            clearInterval(checkInterval);
            return;
          }
          supabase.auth.getSession().then(({ data }) => {
            if (data?.session && !resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              clearInterval(checkInterval);
              if (subscription) {
                subscription.unsubscribe();
              }
              console.log('[AuthCallback] Session found via polling');
              resolve(true);
            }
          });
        }, 1000); // 1秒ごとに確認

        // タイムアウト時にインターバルをクリーンアップ
        setTimeout(() => {
          clearInterval(checkInterval);
        }, timeoutMs);
      }).catch((error) => {
        console.error('[AuthCallback] Error in waitForSession:', error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          if (subscription) {
            subscription.unsubscribe();
          }
          resolve(false);
        }
      });
    }, 500); // 500ms待ってからセッション確認を開始
  });
};

onMounted(async () => {
  console.log('[AuthCallback] Component mounted');
  console.log('[AuthCallback] Full URL:', window.location.href);
  console.log('[AuthCallback] Origin:', window.location.origin);
  console.log('[AuthCallback] Pathname:', window.location.pathname);

  try {
    // OAuthエラーチェック
    const errorParams = getErrorParams();
    if (errorParams.error) {
      console.error('[AuthCallback] OAuth error detected:', {
        error: errorParams.error,
        description: errorParams.errorDescription,
        code: errorParams.errorCode,
      });
      
      // エラーの種類に応じたメッセージを表示
      let errorMessage = 'OAuth認証エラーが発生しました';
      if (errorParams.error === 'access_denied') {
        errorMessage = '認証がキャンセルされました';
      } else if (errorParams.error === 'redirect_uri_mismatch') {
        errorMessage = 'リダイレクトURLの設定が正しくありません。管理者にお問い合わせください。';
      } else if (errorParams.errorDescription) {
        errorMessage = errorParams.errorDescription;
      }
      
      notificationStore.error(errorMessage);
      await router.push('/login');
      return;
    }

    // URLパラメータを確認
    const urlParams = checkUrlParams();

    // codeパラメータがある場合、明示的にexchangeCodeForSessionを呼び出す
    // detectSessionInUrlに依存せず、確実にcode→session交換を行う
    if (urlParams.code) {
      console.log('[AuthCallback] Code parameter found, exchanging code for session...');
      statusMessage.value = '認証情報を処理中...';

      try {
        // 明示的にcodeをセッションに交換（PKCEフロー）
        const { data, error } = await supabase.auth.exchangeCodeForSession(urlParams.code);

        if (error) {
          console.error('[AuthCallback] exchangeCodeForSession error:', error);
          throw error;
        }

        if (data?.session) {
          console.log('[AuthCallback] Session established via exchangeCodeForSession');

          // URLからcodeパラメータを削除（履歴を汚さないためreplaceを使用）
          await router.replace({ path: '/auth/callback' });

          statusMessage.value = 'ユーザー情報を取得中...';
          await withTimeout(authStore.fetchUser(), 10000);
          notificationStore.success('ログインに成功しました');
          await router.push('/');
          return;
        }
      } catch (error) {
        console.error('[AuthCallback] Error exchanging code for session:', error);
        // エラーの場合はフォールバックとしてwaitForSessionを試行
        console.log('[AuthCallback] Falling back to waitForSession...');
      }
    }

    // フォールバック: codeがない場合やexchangeCodeForSessionが失敗した場合
    // access_tokenがハッシュに含まれている場合（implicitフロー）などに対応
    console.log('[AuthCallback] Waiting for Supabase to process authentication...');
    statusMessage.value = '認証情報を処理中...';

    const hasSession = await waitForSession();

    if (hasSession) {
      console.log('[AuthCallback] Session established successfully');
      statusMessage.value = 'ユーザー情報を取得中...';
      
      try {
        // fetchUserにもタイムアウトを設定（10秒）
        await withTimeout(authStore.fetchUser(), 10000);
        notificationStore.success('ログインに成功しました');
        await router.push('/');
        return;
      } catch (fetchError) {
        console.error('[AuthCallback] Failed to fetch user:', fetchError);
        // セッションは確立されているので、プロフィール取得に失敗してもログインは成功とみなす
        if (fetchError instanceof Error && fetchError.message.includes('Timeout')) {
          console.warn('[AuthCallback] fetchUser timed out, but session is valid');
          notificationStore.success('ログインに成功しました');
          await router.push('/');
        } else {
          notificationStore.error('ユーザー情報の取得に失敗しました。もう一度お試しください。');
          await router.push('/login');
        }
        return;
      }
    }

    // セッションが見つからない場合
    console.error('[AuthCallback] No session found after waiting');

    // URLパラメータを再確認して、より詳細なエラーメッセージを提供
    const finalUrlParams = checkUrlParams();
    let errorMessage = '認証に失敗しました。もう一度お試しください。';

    if (!finalUrlParams.code && !finalUrlParams.access_token) {
      errorMessage = '認証情報がURLに含まれていません。SupabaseのRedirect URLs設定を確認してください。';
      console.error('[AuthCallback] Missing authentication parameters in URL');
    }
    
    notificationStore.error(errorMessage);
    await router.push('/login');
  } catch (error) {
    console.error('[AuthCallback] Unexpected error:', error);
    statusMessage.value = 'エラーが発生しました';
    const errorMessage = error instanceof Error ? error.message : '認証処理中にエラーが発生しました';
    notificationStore.error(errorMessage);
    await router.push('/login');
  }
});
</script>

<style scoped>
.callback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}
</style>
