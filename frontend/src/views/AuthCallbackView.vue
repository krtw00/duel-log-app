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
  };
};

/**
 * セッションを待機（detectSessionInUrl: true が処理するのを待つ）
 * Supabaseが自動でURLから認証パラメータを検出・処理する
 */
const waitForSession = async (maxAttempts = 15, delayMs = 400): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 5000);
      if (data?.session) {
        console.log(`[AuthCallback] Session found on attempt ${i + 1}`);
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
  console.log('[AuthCallback] URL:', window.location.href);

  try {
    // OAuthエラーチェック
    const errorParams = getErrorParams();
    if (errorParams.error) {
      console.error('[AuthCallback] OAuth error:', errorParams.error, errorParams.errorDescription);
      notificationStore.error(errorParams.errorDescription || 'OAuth認証エラーが発生しました');
      await router.push('/login');
      return;
    }

    // detectSessionInUrl: true により、Supabaseが自動でセッションを処理
    // ここではセッションが確立されるのを待機するだけ
    console.log('[AuthCallback] Waiting for Supabase to process authentication...');
    statusMessage.value = 'セッションを確立中...';

    const hasSession = await waitForSession();

    if (hasSession) {
      console.log('[AuthCallback] Session established successfully');
      statusMessage.value = 'ユーザー情報を取得中...';
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      await router.push('/');
      return;
    }

    // セッションが見つからない場合
    console.log('[AuthCallback] No session found after waiting');
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
