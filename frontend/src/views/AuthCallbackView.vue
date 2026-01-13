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

onMounted(async () => {
  console.log('[AuthCallback] Component mounted');
  console.log('[AuthCallback] Current URL:', window.location.href);

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('[AuthCallback] URL params - code:', code ? 'present' : 'missing');
    console.log('[AuthCallback] URL params - error:', errorParam);

    // OAuthエラーチェック
    if (errorParam) {
      console.error('[AuthCallback] OAuth error:', errorParam, errorDescription);
      notificationStore.error(errorDescription || 'OAuth認証エラーが発生しました');
      router.push('/login');
      return;
    }

    if (code) {
      console.log('[AuthCallback] Exchanging code for session...');
      statusMessage.value = 'セッションを確立中...';

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('[AuthCallback] Exchange result - error:', error);
      console.log('[AuthCallback] Exchange result - session:', data?.session ? 'present' : 'missing');

      if (error) {
        console.error('[AuthCallback] Code exchange error:', error);
        throw error;
      }

      if (data.session) {
        console.log('[AuthCallback] Session established, fetching user...');
        statusMessage.value = 'ユーザー情報を取得中...';

        await authStore.fetchUser();

        console.log('[AuthCallback] User fetched, redirecting to dashboard...');
        notificationStore.success('ログインに成功しました');
        await router.push('/');
        return;
      }
    }

    // codeがない場合は既存のセッションを確認
    console.log('[AuthCallback] No code, checking existing session...');
    const { data, error } = await supabase.auth.getSession();

    console.log('[AuthCallback] getSession result - error:', error);
    console.log('[AuthCallback] getSession result - session:', data?.session ? 'present' : 'missing');

    if (error) {
      throw error;
    }

    if (data.session) {
      console.log('[AuthCallback] Existing session found, fetching user...');
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      await router.push('/');
    } else {
      console.log('[AuthCallback] No session, redirecting to login...');
      notificationStore.error('認証に失敗しました');
      await router.push('/login');
    }
  } catch (error) {
    console.error('[AuthCallback] Error:', error);
    statusMessage.value = 'エラーが発生しました';
    notificationStore.error('認証処理中にエラーが発生しました');
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
