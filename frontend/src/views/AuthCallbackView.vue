<template>
  <div class="callback-container">
    <v-progress-circular indeterminate size="64" color="primary" />
    <p class="mt-4 text-grey">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase, clearSupabaseLocalStorage } from '@/lib/supabase';
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
 * URLからパラメータを取得（クエリパラメータとハッシュフラグメントの両方をチェック）
 */
const getUrlParams = () => {
  // クエリパラメータをチェック
  const searchParams = new URLSearchParams(window.location.search);

  // ハッシュフラグメントをチェック（#access_token=... or #code=... 形式）
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  return {
    code: searchParams.get('code') || hashParams.get('code'),
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
    error: searchParams.get('error') || hashParams.get('error'),
    errorDescription:
      searchParams.get('error_description') || hashParams.get('error_description'),
  };
};

/**
 * セッションを待機（detectSessionInUrlが処理するのを待つ）
 */
const waitForSession = async (maxAttempts = 10, delayMs = 500): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // 各getSession呼び出しにタイムアウトを設定
      const { data } = await withTimeout(supabase.auth.getSession(), 3000);
      if (data?.session) {
        return true;
      }
    } catch (error) {
      console.warn(`[AuthCallback] getSession attempt ${i + 1} failed:`, error);
    }
    console.log(`[AuthCallback] Waiting for session... attempt ${i + 1}/${maxAttempts}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

onMounted(async () => {
  console.log('[AuthCallback] Component mounted');
  console.log('[AuthCallback] Current URL:', window.location.href);
  console.log('[AuthCallback] Hash:', window.location.hash);
  console.log('[AuthCallback] Search:', window.location.search);

  try {
    const params = getUrlParams();

    console.log('[AuthCallback] Parsed params:', {
      code: params.code ? 'present' : 'missing',
      accessToken: params.accessToken ? 'present' : 'missing',
      error: params.error,
    });

    // OAuthエラーチェック
    if (params.error) {
      console.error('[AuthCallback] OAuth error:', params.error, params.errorDescription);
      notificationStore.error(params.errorDescription || 'OAuth認証エラーが発生しました');
      await router.push('/login');
      return;
    }

    // ハッシュフラグメントにアクセストークンがある場合（implicit flow）
    // detectSessionInUrlが自動で処理するはずなので、セッションを待機
    if (params.accessToken || window.location.hash.includes('access_token')) {
      console.log('[AuthCallback] Access token in hash, waiting for Supabase to process...');
      statusMessage.value = 'セッションを確立中...';

      const hasSession = await waitForSession();
      if (hasSession) {
        console.log('[AuthCallback] Session established via hash fragment');
        statusMessage.value = 'ユーザー情報を取得中...';
        await authStore.fetchUser();
        notificationStore.success('ログインに成功しました');
        await router.push('/');
        return;
      }
    }

    // PKCEフローのコードがある場合
    // detectSessionInUrl: true により Supabase が自動的にコード交換を行うため、
    // 手動で exchangeCodeForSession を呼び出さず、セッション確立を待機する
    if (params.code) {
      const startTime = performance.now();
      console.log('[AuthCallback] Code found, waiting for Supabase auto-exchange (detectSessionInUrl)...');

      // PKCEのcode_verifierが存在するか確認（デバッグ用）
      const codeVerifierKeys = Object.keys(localStorage).filter((key) =>
        key.includes('code-verifier'),
      );
      console.log('[AuthCallback] Code verifier keys in localStorage:', codeVerifierKeys);

      statusMessage.value = 'セッションを確立中...';

      // detectSessionInUrl の自動処理が完了するのを待つ（最大30秒）
      const hasSession = await waitForSession(60, 500); // 60回 × 500ms = 30秒

      if (hasSession) {
        console.log(`[AuthCallback] Session established via detectSessionInUrl (${(performance.now() - startTime).toFixed(0)}ms)`);
        statusMessage.value = 'ユーザー情報を取得中...';

        const fetchStart = performance.now();
        console.log('[AuthCallback] Starting fetchUser...');
        await authStore.fetchUser();
        console.log(`[AuthCallback] fetchUser completed in ${(performance.now() - fetchStart).toFixed(0)}ms`);

        notificationStore.success('ログインに成功しました');
        console.log(`[AuthCallback] Total: ${(performance.now() - startTime).toFixed(0)}ms`);
        await router.push('/');
        return;
      } else {
        console.error('[AuthCallback] Session not established after waiting');
        throw new Error('セッションの確立に失敗しました。もう一度お試しください。');
      }
    }

    // 既存セッションをチェック（ページリロード時など）
    console.log('[AuthCallback] Checking for existing session...');
    statusMessage.value = 'セッションを確認中...';

    const { data: existingSession } = await withTimeout(supabase.auth.getSession(), 3000).catch(() => ({ data: null }));

    if (existingSession?.session) {
      console.log('[AuthCallback] Existing session found');
      statusMessage.value = 'ユーザー情報を取得中...';
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      await router.push('/');
      return;
    }

    // 何も見つからない場合、少し待ってからもう一度チェック
    console.log('[AuthCallback] No immediate session, waiting for detectSessionInUrl...');
    statusMessage.value = 'セッションを待機中...';

    const hasSession = await waitForSession(5, 300);
    if (hasSession) {
      console.log('[AuthCallback] Session found after waiting');
      statusMessage.value = 'ユーザー情報を取得中...';
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      await router.push('/');
      return;
    }

    // 最終的にセッションが見つからない場合
    console.log('[AuthCallback] No session found, redirecting to login');
    notificationStore.error('認証に失敗しました。もう一度お試しください。');
    await router.push('/login');
  } catch (error) {
    console.error('[AuthCallback] Error:', error);
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
