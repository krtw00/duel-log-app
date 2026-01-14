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
 * URLからパラメータを取得（クエリパラメータとハッシュフラグメントの両方をチェック）
 */
const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  return {
    code: searchParams.get('code') || hashParams.get('code'),
    accessToken: hashParams.get('access_token'),
    error: searchParams.get('error') || hashParams.get('error'),
    errorDescription:
      searchParams.get('error_description') || hashParams.get('error_description'),
  };
};

onMounted(async () => {
  console.log('[AuthCallback] Component mounted');
  console.log('[AuthCallback] URL:', window.location.href);

  try {
    const params = getUrlParams();

    console.log('[AuthCallback] Params:', {
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

    // PKCEフローのコードがある場合
    if (params.code) {
      console.log('[AuthCallback] Exchanging code for session...');
      statusMessage.value = 'セッションを確立中...';

      // デバッグ: code_verifier の存在確認
      const codeVerifierKeys = Object.keys(localStorage).filter((key) =>
        key.includes('code-verifier'),
      );
      console.log('[AuthCallback] Code verifier keys:', codeVerifierKeys);

      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

      if (error) {
        console.error('[AuthCallback] Code exchange error:', error);
        // コード交換エラー時はストレージをクリアして再試行を促す
        clearSupabaseLocalStorage();
        throw new Error(error.message || '認証に失敗しました。もう一度お試しください。');
      }

      if (data.session) {
        console.log('[AuthCallback] Session established successfully');
        statusMessage.value = 'ユーザー情報を取得中...';
        await authStore.fetchUser();
        notificationStore.success('ログインに成功しました');
        await router.push('/');
        return;
      }
    }

    // ハッシュフラグメントにアクセストークンがある場合（implicit flow - 通常は使用しない）
    if (params.accessToken) {
      console.log('[AuthCallback] Access token found in hash, setting session...');
      statusMessage.value = 'セッションを確立中...';

      // implicit flow の場合は手動でセッションを設定
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const refreshToken = hashParams.get('refresh_token');

      if (refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthCallback] Set session error:', error);
          throw error;
        }

        if (data.session) {
          console.log('[AuthCallback] Session set successfully');
          statusMessage.value = 'ユーザー情報を取得中...';
          await authStore.fetchUser();
          notificationStore.success('ログインに成功しました');
          await router.push('/');
          return;
        }
      }
    }

    // 既存セッションをチェック（ページリロード時など）
    console.log('[AuthCallback] Checking existing session...');
    statusMessage.value = 'セッションを確認中...';

    const { data: existingSession } = await supabase.auth.getSession();

    if (existingSession?.session) {
      console.log('[AuthCallback] Existing session found');
      statusMessage.value = 'ユーザー情報を取得中...';
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      await router.push('/');
      return;
    }

    // セッションが見つからない場合
    console.log('[AuthCallback] No session found');
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
