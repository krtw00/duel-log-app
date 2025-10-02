<template>
  <v-app>
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
            <p class="app-subtitle">Create Your Account</p>
          </div>

          <!-- 新規登録フォーム -->
          <v-form @submit.prevent="handleRegister" ref="formRef">
            <v-text-field
              v-model="username"
              label="ユーザー名"
              prepend-inner-icon="mdi-account-outline"
              type="text"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.username]"
              class="mb-2"
            />

            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.email]"
              class="mb-2"
            />

            <v-text-field
              v-model="password"
              label="パスワード"
              prepend-inner-icon="mdi-lock-outline"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.password]"
              class="mb-2"
            />

            <v-text-field
              v-model="passwordConfirm"
              label="パスワード（確認）"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showPasswordConfirm ? 'text' : 'password'"
              :append-inner-icon="showPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.passwordMatch]"
              class="mb-4"
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
              新規登録
            </v-btn>

            <!-- リンク -->
            <div class="text-center">
              <v-divider class="my-3" />
              <p class="text-caption text-grey">
                既にアカウントをお持ちの方は
                <router-link to="/login" class="text-secondary">ログイン</router-link>
              </p>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

const formRef = ref()
const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const loading = ref(false)

const rules = {
  required: (v: string) => !!v || '入力必須です',
  username: (v: string) => (v && v.length >= 3) || 'ユーザー名は3文字以上で入力してください',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません',
  password: (v: string) => (v && v.length >= 6) || 'パスワードは6文字以上で入力してください',
  passwordMatch: (v: string) => v === password.value || 'パスワードが一致しません'
}

const handleRegister = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    await api.post('/users/', {
      username: username.value,
      email: email.value,
      password: password.value
    })

    notificationStore.success('登録が完了しました。ログイン画面に移動します...')
    
    // 2秒後にログイン画面へ遷移
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    // エラーはAPIインターセプターで処理される
    console.error('Failed to register:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0a0e27;
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
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
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
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

.register-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
  margin: 20px;
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
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
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
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
