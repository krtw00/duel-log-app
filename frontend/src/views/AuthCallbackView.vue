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

    // detectSessionInUrl: trueにより、Supabaseが自動でコードを処理している可能性がある
    // まず既存のセッションを確認
    console.log(
      '[AuthCallback] Checking for existing session (detectSessionInUrl may have processed code)...',
    );
    statusMessage.value = 'セッションを確認中...';

    const { data: existingSession, error: sessionError } = await supabase.auth.getSession();

    console.log('[AuthCallback] getSession result - error:', sessionError);
    console.log(
      '[AuthCallback] getSession result - session:',
      existingSession?.session ? 'present' : 'missing',
    );

    if (sessionError) {
      console.error('[AuthCallback] Session check error:', sessionError);
      throw sessionError;
    }

    // セッションが既に存在する場合（detectSessionInUrlが処理済み）
    if (existingSession?.session) {
      console.log('[AuthCallback] Session already established, fetching user...');
      statusMessage.value = 'ユーザー情報を取得中...';

      await authStore.fetchUser();

      console.log('[AuthCallback] User fetched, redirecting to dashboard...');
      notificationStore.success('ログインに成功しました');
      await router.push('/');
      return;
    }

    // セッションがない場合、コードがあれば手動で交換を試みる
    if (code) {
      console.log('[AuthCallback] No session yet, exchanging code for session...');
      statusMessage.value = 'セッションを確立中...';

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('[AuthCallback] Exchange result - error:', error);
      console.log(
        '[AuthCallback] Exchange result - session:',
        data?.session ? 'present' : 'missing',
      );

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

    // コードもセッションもない場合
    console.log('[AuthCallback] No session and no code, redirecting to login...');
    notificationStore.error('認証に失敗しました');
    await router.push('/login');
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
