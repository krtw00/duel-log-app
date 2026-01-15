<template>
  <div class="register-container">
    <!-- 背景装飾 -->
    <div class="background-overlay">
      <div class="grid-pattern"></div>
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>
    </div>

    <!-- 新規登録カード -->
    <v-card class="register-card" elevation="24">
      <div class="card-glow"></div>

      <v-card-text class="pa-8">
        <!-- ロゴ・タイトル -->
        <div class="text-center mb-8">
          <h1 class="app-title">
            <span class="text-primary">DUEL</span>
            <span class="text-secondary">LOG</span>
          </h1>
          <p class="app-subtitle">{{ LL?.auth.register.subtitle() }}</p>
        </div>

        <!-- 新規登録フォーム -->
        <v-form ref="formRef" @submit.prevent="handleRegister">
          <v-text-field
            v-model="username"
            name="username"
            :label="LL?.auth.register.username()"
            prepend-inner-icon="mdi-account-outline"
            type="text"
            variant="outlined"
            color="primary"
            :rules="[rules.required, rules.username]"
            class="mb-2"
          />

          <v-text-field
            v-model="email"
            name="email"
            :label="LL?.auth.register.email()"
            prepend-inner-icon="mdi-email-outline"
            type="email"
            variant="outlined"
            color="primary"
            :rules="[rules.required, rules.email]"
            class="mb-2"
          />

          <v-text-field
            v-model="password"
            name="password"
            :label="LL?.auth.register.password()"
            prepend-inner-icon="mdi-lock-outline"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            color="primary"
            :rules="[rules.required, rules.password]"
            class="mb-2"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-text-field
            v-model="passwordConfirm"
            name="password_confirm"
            :label="LL?.auth.register.confirmPassword()"
            prepend-inner-icon="mdi-lock-check-outline"
            :type="showPasswordConfirm ? 'text' : 'password'"
            :append-inner-icon="showPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            color="primary"
            :rules="[rules.required, rules.passwordMatch]"
            class="mb-4"
            @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
          />

          <!-- 登録ボタン -->
          <v-btn
            type="submit"
            block
            size="large"
            color="primary"
            :loading="loading"
            class="register-btn mb-4"
          >
            <v-icon start>mdi-account-plus</v-icon>
            {{ LL?.auth.register.submit() }}
          </v-btn>

          <!-- リンク -->
          <div class="text-center">
            <v-divider class="my-3" />
            <p class="text-caption text-grey">
              {{ LL?.auth.register.hasAccount() }}
              <router-link to="/login" class="text-secondary">{{ LL?.auth.register.login() }}</router-link>
            </p>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { createLogger } from '@/utils/logger';
import { useNotificationStore } from '@/stores/notification';
import { useLocale } from '@/composables/useLocale';

const logger = createLogger('Register');
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { LL } = useLocale();

const formRef = ref();
const username = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const rules = computed(() => ({
  required: (v: string) => !!v || LL.value?.validation.required() || '',
  username: (v: string) => (v && v.length >= 3) || LL.value?.validation.username() || '',
  email: (v: string) => /.+@.+\..+/.test(v) || LL.value?.validation.email() || '',
  password: (v: string) => (v && v.length >= 6) || LL.value?.validation.passwordMinLength6() || '',
  passwordMatch: (v: string) => v === password.value || LL.value?.validation.passwordMatch() || '',
}));

const handleRegister = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await authStore.register(email.value, password.value, username.value);

    if (result.requiresConfirmation) {
      // メール確認が必要な場合
      notificationStore.success(
        LL.value?.auth.register.successWithConfirmation() || 'Confirmation email sent.',
      );
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      // メール確認不要（自動ログイン完了、register内でダッシュボードへリダイレクト済み）
      notificationStore.success(LL.value?.auth.register.success() || 'Registration complete!');
    }
  } catch (error: unknown) {
    logger.error('Failed to register', error);
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = LL.value?.validation.unexpectedError() || 'An unexpected error occurred';
    }
    notificationStore.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.register-container {
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

.register-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
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

.register-btn {
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
