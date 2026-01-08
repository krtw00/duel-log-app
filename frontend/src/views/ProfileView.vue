<template>
  <app-layout current-view="profile">
    <v-container class="d-flex justify-center align-center fill-height">
      <div style="width: 100%; max-width: 600px">
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
                :readonly="form.streamerMode"
                :hint="
                  form.streamerMode
                    ? '配信者モードが有効なため、メールアドレスはマスクされています'
                    : ''
                "
                persistent-hint
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

              <v-divider class="my-4" />

              <div class="streamer-mode-section">
                <div class="d-flex align-center mb-2">
                  <v-icon color="purple" class="mr-2">mdi-video</v-icon>
                  <span class="text-h6">配信者モード</span>
                </div>
                <p class="text-caption text-grey mb-3">
                  有効にすると、アプリ内のメールアドレスが自動的にマスクされます。配信や録画時のプライバシー保護に便利です。
                </p>
                <v-switch
                  v-model="form.streamerMode"
                  color="purple"
                  label="配信者モードを有効にする"
                  hide-details
                ></v-switch>
              </div>
            </v-form>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn color="primary" :loading="loading" size="large" @click="handleUpdate">
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
            <p class="text-body-1 mb-4">
              この操作は元に戻せません。アカウントを削除すると、すべてのデッキと対戦履歴が完全に削除されます。
            </p>
            <v-btn color="error" block size="large" @click="deleteDialog = true">
              <v-icon start>mdi-delete-forever</v-icon>
              アカウントを削除する
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Data Management Card -->
        <v-card class="data-management-card mt-6">
          <v-card-title class="pa-6">
            <v-icon class="mr-2" color="primary">mdi-database</v-icon>
            <span class="text-h5">データ管理</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
              全データをCSVファイルとしてエクスポート（バックアップ）したり、インポート（復元）したりできます。
            </p>
            <v-row>
              <v-col cols="6">
                <v-btn color="primary" block size="large" @click="exportAllData">
                  <v-icon start>mdi-export</v-icon>
                  エクスポート
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn color="secondary" block size="large" @click="triggerImportFileInput">
                  <v-icon start>mdi-import</v-icon>
                  インポート
                </v-btn>
              </v-col>
            </v-row>
            <input
              ref="importFileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="importBackup"
            />
          </v-card-text>
        </v-card>
      </div>
    </v-container>

    <!-- Deletion Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500" persistent>
      <v-card class="delete-dialog-card">
        <v-card-title class="text-h5"> 本当にアカウントを削除しますか？ </v-card-title>
        <v-card-text>
          <p class="mb-4">
            この操作は取り消せません。続行するには、以下のボックスに「<strong class="text-error"
              >DELETE</strong
            >」と入力してください。
          </p>
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
  </app-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { api } from '@/services/api';
import AppLayout from '@/components/layout/AppLayout.vue';
import { maskEmail } from '@/utils/maskEmail';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const formRef = ref();
const loading = ref(false);
const form = ref({
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  streamerMode: false,
});

const deleteDialog = ref(false);
const deleteConfirmText = ref('');
const deleting = ref(false);

const importFileInput = ref<HTMLInputElement | null>(null);

const triggerImportFileInput = () => {
  importFileInput.value?.click();
};

const exportAllData = async () => {
  notificationStore.info('全データのバックアップを生成しています...');
  try {
    const response = await api.get('/me/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `duellog_backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notificationStore.success('バックアップファイルをダウンロードしました。');
  } catch (error) {
    console.error('Failed to export data:', error);
    notificationStore.error('データのエクスポートに失敗しました。');
  }
};

const importBackup = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!confirm('本当にバックアップから復元しますか？現在のデータはすべて削除されます。')) {
    // Clear the file input so the same file can be selected again
    if (importFileInput.value) {
      importFileInput.value.value = '';
    }
    return;
  }

  loading.value = true;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/me/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { created, errors } = response.data;

    if (errors && errors.length > 0) {
      notificationStore.error('復元中にエラーが発生しました。');
      console.error('Import Errors:', errors);
    } else {
      notificationStore.success(`${created}件の対戦記録を復元しました`);
    }

    // Refresh data on the dashboard
    // This is a bit of a hack, but it's the easiest way to refresh the data
    // after a successful import on a different view.
    // A better solution would be a shared service or a more robust state management.
    await authStore.fetchUser(); // to refresh user related data if any
  } catch (error) {
    console.error('Failed to import data:', error);
    notificationStore.error('データのインポートに失敗しました。');
  } finally {
    loading.value = false;
    if (importFileInput.value) {
      importFileInput.value.value = '';
    }
  }
};

const rules = {
  required: (v: unknown) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません',
  password: (v: string) => {
    if (!v) return true; // パスワードは任意
    return (
      (v.length >= 8 && v.length <= 72) || 'パスワードは8文字以上、72文字以下で入力してください'
    );
  },
  passwordConfirm: (v: string) => {
    if (!form.value.password) return true;
    return v === form.value.password || 'パスワードが一致しません';
  },
};

const actualEmail = ref('');

onMounted(() => {
  if (authStore.user) {
    form.value.username = authStore.user.username;
    actualEmail.value = authStore.user.email;
    form.value.email = authStore.user.email;
    form.value.streamerMode = authStore.user.streamer_mode;
  }
});

// 配信者モードの切り替え時にメールアドレスの表示を切り替え
watch(
  () => form.value.streamerMode,
  (newValue) => {
    if (newValue) {
      form.value.email = maskEmail(actualEmail.value);
    } else {
      form.value.email = actualEmail.value;
    }
  },
);

const handleUpdate = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const payload: {
      username: string;
      email: string;
      streamer_mode: boolean;
      password?: string;
    } = {
      username: form.value.username,
      email: actualEmail.value, // 実際のメールアドレスを送信
      streamer_mode: form.value.streamerMode,
    };

    if (form.value.password) {
      payload.password = form.value.password;
    }

    const response = await api.put('/me/', payload);

    // ストアのユーザー情報を更新
    authStore.user = response.data;
    actualEmail.value = response.data.email;

    // フォームのメールアドレスも更新
    form.value.email = form.value.streamerMode
      ? maskEmail(response.data.email)
      : response.data.email;

    notificationStore.success('プロフィールを更新しました');

    // パスワードフィールドをクリア
    form.value.password = '';
    form.value.passwordConfirm = '';
    formRef.value.resetValidation();
  } catch (error) {
    console.error('Failed to update profile:', error);
    // エラー通知はapi.tsのインターセプターが処理
  } finally {
    loading.value = false;
  }
};

const handleDeleteAccount = async () => {
  if (deleteConfirmText.value !== 'DELETE') return;

  deleting.value = true;
  try {
    await api.delete('/me/');
    notificationStore.success('アカウントが正常に削除されました');
    // ログアウト処理でリダイレクト
    await authStore.logout();
  } catch (error) {
    console.error('Failed to delete account:', error);
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
  }
};
</script>

<style scoped lang="scss">
.profile-card,
.delete-card,
.delete-dialog-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
}

.delete-card {
  border-color: rgba(255, 72, 72, 0.5);
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
</style>
