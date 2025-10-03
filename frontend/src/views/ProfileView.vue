<template>
  <v-app>
    <app-bar current-view="profile" @toggle-drawer="drawer = !drawer" />

    <!-- レスポンシブ対応のナビゲーションドロワー -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav dense>
        <v-list-item
          v-for="item in navItems"
          :key="item.view"
          :prepend-icon="item.icon"
          :to="item.path"
          :title="item.name"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-content">
      <v-container class="d-flex justify-center align-center fill-height">
        <div style="width: 100%; max-width: 600px;">
          <v-card class="profile-card mb-6">
            <div class="card-glow"></div>
            <v-card-title class="pa-6">
              <v-icon class="mr-2" color="primary">mdi-account-edit</v-icon>
              <span class="text-h5">プロフィール編集</span>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
              <v-form ref="formRef" @submit.prevent="handleUpdate">
                <v-text-field
                  v-model="form.username"
                  label="ユーザー名"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  color="primary"
                  :rules="[rules.required]"
                  class="mb-4"
                ></v-text-field>

                <v-text-field
                  v-model="form.email"
                  label="メールアドレス"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  color="primary"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  class="mb-4"
                ></v-text-field>

                <v-text-field
                  v-model="form.password"
                  label="新しいパスワード (変更する場合のみ)"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  color="primary"
                  type="password"
                  :rules="[rules.password]"
                  placeholder="8文字以上、72文字以下"
                  class="mb-4"
                  clearable
                ></v-text-field>

                <v-text-field
                  v-model="form.passwordConfirm"
                  label="新しいパスワードの確認"
                  prepend-inner-icon="mdi-lock-check"
                  variant="outlined"
                  color="primary"
                  type="password"
                  :rules="[rules.passwordConfirm]"
                  class="mb-4"
                  clearable
                ></v-text-field>
              </v-form>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
              <v-spacer />
              <v-btn
                color="primary"
                :loading="loading"
                @click="handleUpdate"
                size="large"
              >
                <v-icon start>mdi-content-save</v-icon>
                更新
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Account Deletion Card -->
          <v-card class="delete-card">
            <v-card-title class="pa-6">
              <v-icon class="mr-2" color="error">mdi-alert-octagon</v-icon>
              <span class="text-h5">アカウント削除</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <p class="text-body-1 mb-4">この操作は元に戻せません。アカウントを削除すると、すべてのデッキと対戦履歴が完全に削除されます。</p>
              <v-btn
                color="error"
                @click="deleteDialog = true"
                block
                size="large"
              >
                <v-icon start>mdi-delete-forever</v-icon>
                アカウントを削除する
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-container>
    </v-main>

    <!-- Deletion Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500" persistent>
      <v-card class="delete-dialog-card">
        <v-card-title class="text-h5">
          本当にアカウントを削除しますか？
        </v-card-title>
        <v-card-text>
          <p class="mb-4">この操作は取り消せません。続行するには、以下のボックスに「<strong class="text-error">DELETE</strong>」と入力してください。</p>
          <v-text-field
            v-model="deleteConfirmText"
            label="確認のため 'DELETE' と入力"
            variant="outlined"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">キャンセル</v-btn>
          <v-btn
            color="error"
            :disabled="deleteConfirmText !== 'DELETE'"
            :loading="deleting"
            @click="handleDeleteAccount"
          >
            削除を実行
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { api } from '../services/api'
import AppBar from '../components/layout/AppBar.vue'

const drawer = ref(false)
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' }
]

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const deleteDialog = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)

const rules = {
  required: (v: any) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません',
  password: (v: string) => {
    if (!v) return true // パスワードは任意
    return (v.length >= 8 && v.length <= 72) || 'パスワードは8文字以上、72文字以下で入力してください'
  },
  passwordConfirm: (v: string) => {
    if (!form.value.password) return true
    return v === form.value.password || 'パスワードが一致しません'
  }
}

onMounted(() => {
  if (authStore.user) {
    form.value.username = authStore.user.username
    form.value.email = authStore.user.email
  }
})

const handleUpdate = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    const payload: any = {
      username: form.value.username,
      email: form.value.email
    }

    if (form.value.password) {
      payload.password = form.value.password
    }

    const response = await api.put('/me/', payload)

    // ストアのユーザー情報を更新
    authStore.user = response.data

    notificationStore.success('プロフィールを更新しました')

    // パスワードフィールドをクリア
    form.value.password = ''
    form.value.passwordConfirm = ''
    formRef.value.resetValidation()

  } catch (error) {
    console.error('Failed to update profile:', error)
    // エラー通知はapi.tsのインターセプターが処理
  } finally {
    loading.value = false
  }
}

const handleDeleteAccount = async () => {
  if (deleteConfirmText.value !== 'DELETE') return

  deleting.value = true
  try {
    await api.delete('/me/')
    notificationStore.success('アカウントが正常に削除されました')
    // ログアウト処理でリダイレクト
    await authStore.logout()
  } catch (error) {
    console.error('Failed to delete account:', error)
  } finally {
    deleting.value = false
    deleteDialog.value = false
  }
}
</script>

<style scoped lang="scss">
.main-content {
  background: #0a0e27;
}

.profile-card, .delete-card, .delete-dialog-card {
  background: rgba(18, 22, 46, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
}

.delete-card {
  border-color: rgba(255, 72, 72, 0.3);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

.delete-card .card-glow {
  background: linear-gradient(90deg, #ff6b6b, #ff2d95, #ff8c42);
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>
