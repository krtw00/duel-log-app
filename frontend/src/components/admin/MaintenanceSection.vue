<template>
  <v-card class="maintenance-card">
    <v-card-title class="pa-6">
      <v-icon class="mr-2" color="primary">mdi-tools</v-icon>
      <span class="text-h5">{{ LL?.admin.maintenance.title() }}</span>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
      <!-- アーカイブデッキのマージ -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="info">mdi-file-document-multiple</v-icon>
          <span>{{ LL?.admin.maintenance.mergeDeck.title() }}</span>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            {{ LL?.admin.maintenance.mergeDeck.description() }}
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :loading="mergeLoading"
            @click="showMergeDialog = true"
          >
            <v-icon start>mdi-file-document-multiple</v-icon>
            {{ LL?.admin.maintenance.mergeDeck.button() }}
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 孤立デッキのクリーンアップ -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="warning">mdi-delete-sweep</v-icon>
          <span>{{ LL?.admin.maintenance.orphanedDecks.title() }}</span>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            {{ LL?.admin.maintenance.orphanedDecks.description() }}
          </p>
          <div class="d-flex align-center gap-3">
            <v-btn
              color="info"
              variant="outlined"
              :loading="orphanedDeckScanning"
              @click="handleScanOrphanedDecks"
            >
              <v-icon start>mdi-magnify</v-icon>
              {{ LL?.admin.maintenance.scan() }}
            </v-btn>
            <v-btn
              v-if="orphanedDeckCount !== null && orphanedDeckCount > 0"
              color="warning"
              variant="flat"
              :loading="orphanedDeckCleaning"
              @click="showOrphanedDeckDialog = true"
            >
              <v-icon start>mdi-delete</v-icon>
              {{ LL?.admin.maintenance.cleanup() }}
            </v-btn>
          </div>
          <v-alert
            v-if="orphanedDeckCount !== null"
            :type="orphanedDeckCount > 0 ? 'warning' : 'success'"
            variant="tonal"
            class="mt-4"
          >
            {{ orphanedDeckCount }}{{ LL?.admin.maintenance.orphanedDecks.found() }}
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- 共有URLのクリーンアップ -->
      <v-card variant="outlined">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="purple">mdi-link-variant</v-icon>
          <span>{{ LL?.admin.maintenance.sharedUrls.title() }}</span>
        </v-card-title>
        <v-card-text>
          <!-- 孤立した共有URL -->
          <div class="mb-6">
            <p class="text-subtitle-2 font-weight-bold mb-2">
              {{ LL?.admin.maintenance.sharedUrls.orphaned.title() }}
            </p>
            <p class="text-body-2 text-grey mb-3">
              {{ LL?.admin.maintenance.sharedUrls.orphaned.description() }}
            </p>
            <div class="d-flex align-center gap-3">
              <v-btn
                color="info"
                variant="outlined"
                size="small"
                :loading="orphanedUrlScanning"
                @click="handleScanOrphanedUrls"
              >
                <v-icon start>mdi-magnify</v-icon>
                {{ LL?.admin.maintenance.scan() }}
              </v-btn>
              <v-btn
                v-if="orphanedUrlCount !== null && orphanedUrlCount > 0"
                color="purple"
                variant="flat"
                size="small"
                :loading="orphanedUrlCleaning"
                @click="showOrphanedUrlDialog = true"
              >
                <v-icon start>mdi-delete</v-icon>
                {{ LL?.admin.maintenance.cleanup() }}
              </v-btn>
            </div>
            <v-alert
              v-if="orphanedUrlCount !== null"
              :type="orphanedUrlCount > 0 ? 'info' : 'success'"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ orphanedUrlCount }}{{ LL?.admin.maintenance.sharedUrls.orphaned.found() }}
            </v-alert>
          </div>

          <v-divider class="mb-6" />

          <!-- 期限切れ共有URL -->
          <div>
            <p class="text-subtitle-2 font-weight-bold mb-2">
              {{ LL?.admin.maintenance.sharedUrls.expired.title() }}
            </p>
            <p class="text-body-2 text-grey mb-3">
              {{ LL?.admin.maintenance.sharedUrls.expired.description() }}
            </p>
            <div class="d-flex align-center gap-3">
              <v-btn
                color="info"
                variant="outlined"
                size="small"
                :loading="expiredUrlScanning"
                @click="handleScanExpiredUrls"
              >
                <v-icon start>mdi-magnify</v-icon>
                {{ LL?.admin.maintenance.scan() }}
              </v-btn>
              <v-btn
                v-if="expiredUrlCount !== null && expiredUrlCount > 0"
                color="error"
                variant="flat"
                size="small"
                :loading="expiredUrlCleaning"
                @click="showExpiredUrlDialog = true"
              >
                <v-icon start>mdi-delete</v-icon>
                {{ LL?.admin.maintenance.bulkDelete() }}
              </v-btn>
            </div>
            <v-alert
              v-if="expiredUrlCount !== null"
              :type="expiredUrlCount > 0 ? 'warning' : 'success'"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ expiredUrlCount }}{{ LL?.admin.maintenance.sharedUrls.expired.found() }}
              <span v-if="oldestExpired" class="text-caption ml-2">
                ({{ LL?.admin.maintenance.sharedUrls.expired.oldest() }}:
                {{ formatDate(oldestExpired) }})
              </span>
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>

    <!-- マージ確認ダイアログ -->
    <v-dialog v-model="showMergeDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
          {{ LL?.admin.maintenance.mergeDeck.confirmTitle() }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            {{ LL?.admin.maintenance.mergeDeck.confirmMessage() }}
          </p>
          <v-alert type="warning" variant="tonal" class="mb-4">
            <p class="text-body-2">
              <strong>{{ LL?.admin.maintenance.warning() }}</strong>
              {{ LL?.admin.maintenance.cannotUndo() }}
            </p>
          </v-alert>
          <p class="text-body-2">{{ LL?.admin.maintenance.confirmProceed() }}</p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showMergeDialog = false">
            {{ LL?.common.cancel() }}
          </v-btn>
          <v-btn color="primary" variant="flat" :loading="mergeLoading" @click="executeMerge">
            {{ LL?.admin.maintenance.execute() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 孤立デッキ削除確認ダイアログ -->
    <v-dialog v-model="showOrphanedDeckDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
          {{ LL?.admin.maintenance.orphanedDecks.confirmTitle() }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            {{ orphanedDeckCount }}{{ LL?.admin.maintenance.orphanedDecks.confirmMessage() }}
          </p>
          <v-alert type="warning" variant="tonal">
            <p class="text-body-2">
              <strong>{{ LL?.admin.maintenance.warning() }}</strong>
              {{ LL?.admin.maintenance.cannotUndo() }}
            </p>
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showOrphanedDeckDialog = false">
            {{ LL?.common.cancel() }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            :loading="orphanedDeckCleaning"
            @click="handleCleanupOrphanedDecks"
          >
            {{ LL?.admin.maintenance.execute() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 孤立URL削除確認ダイアログ -->
    <v-dialog v-model="showOrphanedUrlDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="purple">mdi-alert-circle</v-icon>
          {{ LL?.admin.maintenance.sharedUrls.orphaned.confirmTitle() }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            {{ orphanedUrlCount }}{{ LL?.admin.maintenance.sharedUrls.orphaned.confirmMessage() }}
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showOrphanedUrlDialog = false">
            {{ LL?.common.cancel() }}
          </v-btn>
          <v-btn
            color="purple"
            variant="flat"
            :loading="orphanedUrlCleaning"
            @click="handleCleanupOrphanedUrls"
          >
            {{ LL?.admin.maintenance.execute() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 期限切れURL削除確認ダイアログ -->
    <v-dialog v-model="showExpiredUrlDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          {{ LL?.admin.maintenance.sharedUrls.expired.confirmTitle() }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            {{ expiredUrlCount }}{{ LL?.admin.maintenance.sharedUrls.expired.confirmMessage() }}
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showExpiredUrlDialog = false">
            {{ LL?.common.cancel() }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="expiredUrlCleaning"
            @click="handleCleanupExpiredUrls"
          >
            {{ LL?.admin.maintenance.execute() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 結果ダイアログ -->
    <v-dialog v-model="showResultDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" :color="resultSuccess ? 'success' : 'error'">
            {{ resultSuccess ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ resultSuccess ? LL?.admin.maintenance.success() : LL?.admin.maintenance.failed() }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-1">{{ resultMessage }}</p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="showResultDialog = false">
            {{ LL?.common.close() }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { useLocale } from '@/composables/useLocale';
import { api } from '@/services/api';
import {
  scanOrphanedData,
  cleanupOrphanedData,
  scanOrphanedSharedUrls,
  cleanupOrphanedSharedUrls,
  scanExpiredSharedUrls,
  cleanupExpiredSharedUrls,
} from '@/services/adminApi';

const { LL } = useLocale();
const notificationStore = useNotificationStore();

// マージ関連
const mergeLoading = ref(false);
const showMergeDialog = ref(false);

// 孤立デッキ関連
const orphanedDeckScanning = ref(false);
const orphanedDeckCleaning = ref(false);
const orphanedDeckCount = ref<number | null>(null);
const showOrphanedDeckDialog = ref(false);

// 孤立URL関連
const orphanedUrlScanning = ref(false);
const orphanedUrlCleaning = ref(false);
const orphanedUrlCount = ref<number | null>(null);
const showOrphanedUrlDialog = ref(false);

// 期限切れURL関連
const expiredUrlScanning = ref(false);
const expiredUrlCleaning = ref(false);
const expiredUrlCount = ref<number | null>(null);
const oldestExpired = ref<string | null>(null);
const showExpiredUrlDialog = ref(false);

// 結果ダイアログ
const showResultDialog = ref(false);
const resultSuccess = ref(false);
const resultMessage = ref('');

// 日付フォーマット
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString();
};

// マージ実行
async function executeMerge() {
  mergeLoading.value = true;
  showMergeDialog.value = false;

  try {
    const response = await api.post('/admin/merge-archived-decks');
    resultSuccess.value = true;
    resultMessage.value =
      response.data.message || LL.value?.admin.maintenance.mergeDeck.success() || '';
    notificationStore.success(LL.value?.admin.maintenance.mergeDeck.success() || '');
  } catch (error: unknown) {
    resultSuccess.value = false;
    const err = error as { response?: { data?: { detail?: string } } };
    resultMessage.value =
      err.response?.data?.detail || LL.value?.admin.maintenance.mergeDeck.error() || '';
    notificationStore.error(LL.value?.admin.maintenance.mergeDeck.error() || '');
  } finally {
    mergeLoading.value = false;
    showResultDialog.value = true;
  }
}

// 孤立デッキスキャン
async function handleScanOrphanedDecks() {
  orphanedDeckScanning.value = true;
  try {
    const result = await scanOrphanedData();
    orphanedDeckCount.value = result.orphaned_opponent_decks;
  } catch {
    notificationStore.error(LL.value?.admin.maintenance.scanError() || '');
  } finally {
    orphanedDeckScanning.value = false;
  }
}

// 孤立デッキクリーンアップ
async function handleCleanupOrphanedDecks() {
  orphanedDeckCleaning.value = true;
  showOrphanedDeckDialog.value = false;

  try {
    const result = await cleanupOrphanedData();
    resultSuccess.value = result.success;
    resultMessage.value = result.message;
    notificationStore.success(result.message);
    orphanedDeckCount.value = null;
  } catch {
    resultSuccess.value = false;
    resultMessage.value = LL.value?.admin.maintenance.cleanupError() || '';
    notificationStore.error(LL.value?.admin.maintenance.cleanupError() || '');
  } finally {
    orphanedDeckCleaning.value = false;
    showResultDialog.value = true;
  }
}

// 孤立URLスキャン
async function handleScanOrphanedUrls() {
  orphanedUrlScanning.value = true;
  try {
    const result = await scanOrphanedSharedUrls();
    orphanedUrlCount.value = result.orphaned_count;
  } catch {
    notificationStore.error(LL.value?.admin.maintenance.scanError() || '');
  } finally {
    orphanedUrlScanning.value = false;
  }
}

// 孤立URLクリーンアップ
async function handleCleanupOrphanedUrls() {
  orphanedUrlCleaning.value = true;
  showOrphanedUrlDialog.value = false;

  try {
    const result = await cleanupOrphanedSharedUrls();
    resultSuccess.value = result.success;
    resultMessage.value = result.message;
    notificationStore.success(result.message);
    orphanedUrlCount.value = null;
  } catch {
    resultSuccess.value = false;
    resultMessage.value = LL.value?.admin.maintenance.cleanupError() || '';
    notificationStore.error(LL.value?.admin.maintenance.cleanupError() || '');
  } finally {
    orphanedUrlCleaning.value = false;
    showResultDialog.value = true;
  }
}

// 期限切れURLスキャン
async function handleScanExpiredUrls() {
  expiredUrlScanning.value = true;
  try {
    const result = await scanExpiredSharedUrls();
    expiredUrlCount.value = result.expired_count;
    oldestExpired.value = result.oldest_expired;
  } catch {
    notificationStore.error(LL.value?.admin.maintenance.scanError() || '');
  } finally {
    expiredUrlScanning.value = false;
  }
}

// 期限切れURLクリーンアップ
async function handleCleanupExpiredUrls() {
  expiredUrlCleaning.value = true;
  showExpiredUrlDialog.value = false;

  try {
    const result = await cleanupExpiredSharedUrls();
    resultSuccess.value = result.success;
    resultMessage.value = result.message;
    notificationStore.success(result.message);
    expiredUrlCount.value = null;
    oldestExpired.value = null;
  } catch {
    resultSuccess.value = false;
    resultMessage.value = LL.value?.admin.maintenance.cleanupError() || '';
    notificationStore.error(LL.value?.admin.maintenance.cleanupError() || '');
  } finally {
    expiredUrlCleaning.value = false;
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

.gap-3 {
  gap: 12px;
}
</style>
