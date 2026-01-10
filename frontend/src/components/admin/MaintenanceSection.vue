<template>
  <v-card class="maintenance-card">
    <v-card-title class="pa-6">
      <v-icon class="mr-2" color="primary">mdi-tools</v-icon>
      <span class="text-h5">データベースメンテナンス</span>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
      <!-- アーカイブデッキのマージ -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="info">mdi-file-document-multiple</v-icon>
          <span>アーカイブデッキのマージ</span>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            同名のアーカイブ済みデッキを統合します。対戦履歴は最も古いデッキに統合され、重複デッキは削除されます。
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :loading="mergeLoading"
            @click="showMergeDialog = true"
          >
            <v-icon start>mdi-file-document-multiple</v-icon>
            マージを実行
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 今後追加予定の機能 -->
      <v-card variant="outlined" class="mb-4" disabled>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="warning">mdi-delete-sweep</v-icon>
          <span>孤立データのクリーンアップ</span>
          <v-chip class="ml-2" size="small" color="grey">近日公開</v-chip>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-disabled">対戦履歴が存在しない相手デッキを削除します。</p>
        </v-card-text>
      </v-card>

      <v-card variant="outlined" disabled>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-calendar-remove</v-icon>
          <span>古いデータの削除</span>
          <v-chip class="ml-2" size="small" color="grey">近日公開</v-chip>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-disabled">
            指定した日数以前のアーカイブ済みデッキや対戦履歴を削除します。
          </p>
        </v-card-text>
      </v-card>
    </v-card-text>

    <!-- マージ確認ダイアログ -->
    <v-dialog v-model="showMergeDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
          アーカイブデッキのマージ確認
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            この操作は、全ユーザーの同名のアーカイブ済みデッキを統合します。
          </p>
          <v-alert type="warning" variant="tonal" class="mb-4">
            <p class="text-body-2"><strong>注意：</strong>この操作は取り消せません。</p>
          </v-alert>
          <p class="text-body-2">続行してもよろしいですか？</p>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showMergeDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" :loading="mergeLoading" @click="executeMerge">
            実行
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 結果ダイアログ -->
    <v-dialog v-model="showResultDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" :color="mergeSuccess ? 'success' : 'error'">
            {{ mergeSuccess ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ mergeSuccess ? 'マージ完了' : 'マージ失敗' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <p class="text-body-1">{{ mergeResultMessage }}</p>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="showResultDialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { api } from '@/services/api';

const notificationStore = useNotificationStore();

const mergeLoading = ref(false);
const showMergeDialog = ref(false);
const showResultDialog = ref(false);
const mergeSuccess = ref(false);
const mergeResultMessage = ref('');

async function executeMerge() {
  mergeLoading.value = true;
  showMergeDialog.value = false;

  try {
    const response = await api.post('/admin/merge-archived-decks');
    mergeSuccess.value = true;
    mergeResultMessage.value = response.data.message || 'アーカイブデッキのマージが完了しました。';
    notificationStore.success('マージが完了しました');
  } catch (error: any) {
    mergeSuccess.value = false;
    mergeResultMessage.value = error.response?.data?.detail || 'マージ中にエラーが発生しました。';
    notificationStore.error('マージに失敗しました');
  } finally {
    mergeLoading.value = false;
    showResultDialog.value = true;
  }
}
</script>

<style scoped>
.maintenance-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
