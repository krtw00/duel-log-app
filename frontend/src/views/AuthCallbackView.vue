<template>
  <div class="callback-container">
    <v-progress-circular indeterminate size="64" color="primary" />
    <p class="mt-4 text-grey">認証中...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

onMounted(async () => {
  try {
    // URLからcodeパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // PKCEフロー: codeをセッションに交換
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Code exchange error:', error);
        throw error;
      }

      if (data.session) {
        await authStore.fetchUser();
        notificationStore.success('ログインに成功しました');
        router.push('/');
        return;
      }
    }

    // codeがない場合は既存のセッションを確認
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (data.session) {
      await authStore.fetchUser();
      notificationStore.success('ログインに成功しました');
      router.push('/');
    } else {
      notificationStore.error('認証に失敗しました');
      router.push('/login');
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    notificationStore.error('認証処理中にエラーが発生しました');
    router.push('/login');
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
