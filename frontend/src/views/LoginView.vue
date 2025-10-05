<template>
  <v-app>
    <div class="login-container">
      <!-- 背景装飾 -->
      <div class="background-overlay">
        <div class="grid-pattern"></div>
        <div class="glow-orb glow-orb-1"></div>
        <div class="glow-orb glow-orb-2"></div>
      </div>

      <!-- ログインカード -->
      <v-card class="login-card" elevation="24">
        <div class="card-glow"></div>
        
        <v-card-text class="pa-8">
          <!-- ロゴ・タイトル -->
          <div class="text-center mb-8">
            <h1 class="app-title">
              <span class="text-primary">DUEL</span>
              <span class="text-secondary">LOG</span>
            </h1>
            <p class="app-subtitle">Track. Analyze. Dominate.</p>
          </div>

          <!-- ログインフォーム -->
          <v-form @submit.prevent="handleLogin" ref="formRef">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              variant="outlined"
              color="primary"
              :rules="[rules.required, rules.email]"
              class="mb-2"
              :class="{ 'streamer-mode-input': localStreamerMode }"
              :hint="localStreamerMode ? '配信者モードが有効なため、入力内容は非表示になります' : ''"
              persistent-hint
              autocomplete="email"
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
              :rules="[rules.required]"
              class="mb-4"
            />

            <!-- ログインボタン -->
            <v-btn
              type="submit"
              block
              size="large"
              color="primary"
              :loading="loading"
              class="login-btn mb-4"
            >
              <v-icon start>mdi-login</v-icon>
              ログイン
            </v-btn>

            <!-- 配信者モード切り替え -->
            <div class="mb-4">
              <v-switch
                v-model="localStreamerMode"
                color="purple"
                density="compact"
                hide-details
              >
                <template v-slot:label>
                  <div class="d-flex align-center">
                    <v-icon size="small" class="mr-2">mdi-video</v-icon>
                    <span class="text-caption">配信者モード</span>
                  </div>
                </template>
              </v-switch>
              <p class="text-caption text-grey ml-8 mt-1">
                入力内容を非表示にし、再ログイン時にメールアドレスを保持します
              </p>
            </div>

            <!-- リンク -->
            <div class="text-center">
              <router-link to="/forgot-password" class="text-caption text-grey">パスワードを忘れた場合</router-link>
              <v-divider class="my-3" />
              <p class="text-caption text-grey">
                アカウントをお持ちでない方は
                <router-link to="/register" class="text-secondary">新規登録</router-link>
              </p>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const formRef = ref()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const localStreamerMode = ref(authStore.localStreamerMode)

// ローカルストレージから最後のメールアドレスを読み込む
onMounted(() => {
  const savedEmail = localStorage.getItem('lastEmail')
  if (savedEmail) {
    email.value = savedEmail
  }
})

// ローカル配信者モードの変更を監視してストアに反映
watch(localStreamerMode, (newValue) => {
  authStore.toggleStreamerMode(newValue)
})

const rules = {
  required: (v: string) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません'
}

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    // ログイン前にメールアドレスをローカルストレージに保存
    localStorage.setItem('lastEmail', email.value)
    
    await authStore.login(email.value, password.value)
    notificationStore.success('ログインに成功しました')
  } catch (error: any) {
    // エラーはAPIインターセプターで処理されるため、ここでは何もしない
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
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

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
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

.login-btn {
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

// 配信者モード用のスタイル
.streamer-mode-input {
  :deep(input) {
    color: transparent !important;
    text-shadow: 0 0 8px rgba(181, 54, 255, 0.8);
    letter-spacing: 0.3em;
    
    &::selection {
      background-color: rgba(181, 54, 255, 0.3);
      color: transparent;
    }
    
    // プレースホルダーは表示
    &::placeholder {
      color: rgba(228, 231, 236, 0.3) !important;
      text-shadow: none;
      letter-spacing: normal;
    }
  }
}
</style>
