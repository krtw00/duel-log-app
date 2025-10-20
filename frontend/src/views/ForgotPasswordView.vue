<template>
  <div class="forgot-password-container">
      <!-- 背景装飾 -->
      <div class="background-overlay">
        <div class="grid-pattern"></div>
        <div class="glow-orb glow-orb-1"></div>
        <div class="glow-orb glow-orb-2"></div>
      </div>

      <!-- パスワード再設定カード -->
      <v-card class="forgot-password-card" elevation="24">
        <div class="card-glow"></div>

        <v-card-text class="pa-8">
          <!-- タイトル -->
          <div class="text-center mb-8">
            <h1 class="app-title">
              <span class="text-primary">FORGOT</span>
              <span class="text-secondary">PASSWORD</span>
            </h1>
            <p class="app-subtitle">Enter your email to reset your password.</p>
          </div>

          <!-- フォーム -->
          <v-form ref="formRef" @submit.prevent="handleForgotPassword">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.email]"
              class="mb-4"
            />

            <!-- 送信ボタン -->
            <v-btn
              type="submit"
              block
              size="large"
              color="primary"
              :loading="loading"
              class="forgot-password-btn mb-4"
            >
              <v-icon start>mdi-send</v-icon>
              再設定メールを送信
            </v-btn>

            <!-- ログインページへのリンク -->
            <div class="text-center">
              <router-link to="/login" class="text-caption text-grey"
                >ログインページに戻る</router-link
              >
            </div>
          </v-form>
        </v-card-text>
      </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notification';
import api from '../services/api';

const router = useRouter();
const notificationStore = useNotificationStore();

const formRef = ref();
const email = ref('');
const loading = ref(false);

const rules = {
  required: (v: string) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません',
};

const handleForgotPassword = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    await api.post('/auth/forgot-password', { email: email.value });
    notificationStore.success('パスワード再設定の案内をメールで送信しました。');
    router.push('/login'); // ログインページに戻る
  } catch (error: any) {
    // エラーはAPIインターセプターで処理されるため、ここでは何もしない
    console.error('Forgot password error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.grid-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridScroll 20s linear infinite;
}

@keyframes gridScroll {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 8s ease-in-out infinite;
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  background: #00d9ff;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 300px;
  height: 300px;
  background: #b536ff;
  bottom: 15%;
  right: 15%;
  animation-delay: -4s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

.forgot-password-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
  margin: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 16px !important;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

.app-title {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
  background: linear-gradient(135deg, #00d9ff 0%, #b536ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  color: rgba(228, 231, 236, 0.6);
  font-size: 0.9rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 8px;
}

.forgot-password-btn {
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
  }
}

:deep(.v-field--variant-outlined) {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.1);
  }

  &.v-field--focused {
    box-shadow: 0 0 30px rgba(0, 217, 255, 0.2);
  }
}
</style>
