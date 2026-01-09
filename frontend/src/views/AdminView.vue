<template>
  <app-layout current-view="admin" main-class="admin-main">
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">管理者画面</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8" lg="6">
          <v-card>
            <v-card-title class="text-h6">データベース管理</v-card-title>
            <v-card-text>
              <v-alert type="info" class="mb-4">
                重複するアーカイブ済みデッキをマージして、データベースをクリーンアップします。
              </v-alert>

              <v-list>
                <v-list-item>
                  <v-list-item-title>アーカイブデッキのマージ</v-list-item-title>
                  <v-list-item-subtitle>
                    同名のアーカイブ済みデッキを最も古いデッキにマージし、重複を削除します。
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                      color="primary"
                      :loading="merging"
                      :disabled="merging"
                      @click="handleMergeDecks"
                    >
                      実行
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 成功メッセージ -->
      <v-snackbar v-model="successSnackbar" color="success" :timeout="3000">
        {{ successMessage }}
      </v-snackbar>

      <!-- エラーメッセージ -->
      <v-snackbar v-model="errorSnackbar" color="error" :timeout="5000">
        {{ errorMessage }}
      </v-snackbar>

      <!-- 確認ダイアログ -->
      <v-dialog v-model="confirmDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">確認</v-card-title>
          <v-card-text>
            本当にアーカイブ済みデッキのマージを実行しますか？<br />
            この操作は元に戻せません。
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="confirmDialog = false">
              キャンセル
            </v-btn>
            <v-btn color="primary" variant="text" @click="executeMerge">
              実行
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </app-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/api';
import AppLayout from '@/components/layout/AppLayout.vue';

const merging = ref(false);
const confirmDialog = ref(false);
const successSnackbar = ref(false);
const errorSnackbar = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const handleMergeDecks = () => {
  confirmDialog.value = true;
};

const executeMerge = async () => {
  confirmDialog.value = false;
  merging.value = true;

  try {
    const response = await api.post('/admin/merge-archived-decks');
    successMessage.value = response.data.message || 'マージが完了しました';
    successSnackbar.value = true;
  } catch (error: any) {
    console.error('Merge failed:', error);
    console.error('Error response:', error.response);
    console.error('Error data:', error.response?.data);
    errorMessage.value =
      error.response?.data?.detail ||
      error.message ||
      'マージに失敗しました';
    errorSnackbar.value = true;
  } finally {
    merging.value = false;
  }
};
</script>

<style scoped>
.admin-main {
  background-color: var(--v-theme-background);
}
</style>
