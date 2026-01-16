<template>
  <v-dialog v-model="isVisible" max-width="700" scrollable>
    <v-card v-if="userDetail">
      <v-card-title class="pa-6 d-flex align-center">
        <v-avatar size="48" class="mr-3" color="primary">
          <span class="text-h6 text-white">{{ userDetail.username.charAt(0).toUpperCase() }}</span>
        </v-avatar>
        <div>
          <div class="text-h5">{{ userDetail.username }}</div>
          <div class="text-caption text-grey">ID: #{{ userDetail.id }}</div>
        </div>
        <v-spacer />
        <v-chip
          :color="getStatusColor(userDetail.status)"
          size="small"
          variant="flat"
        >
          {{ getStatusLabel(userDetail.status) }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Basic Info -->
        <div class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">
            <v-icon start size="small">mdi-account-details</v-icon>
            {{ LL?.admin.userDetail?.basicInfo() || '基本情報' }}
          </h3>
          <v-row dense>
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.email() || 'メールアドレス' }}</div>
              <div>{{ userDetail.email || '-' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.registeredAt() || '登録日' }}</div>
              <div>{{ formatDate(userDetail.createdat) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.lastLoginAt() || '最終ログイン' }}</div>
              <div>{{ userDetail.last_login_at ? formatDate(userDetail.last_login_at) : '-' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.theme() || 'テーマ' }}</div>
              <div>{{ userDetail.theme_preference === 'dark' ? 'ダーク' : 'ライト' }}</div>
            </v-col>
          </v-row>
          <div v-if="userDetail.status_reason" class="mt-3">
            <div class="text-caption text-grey">{{ LL?.admin.userDetail?.statusReason() || '状態変更理由' }}</div>
            <div class="text-error">{{ userDetail.status_reason }}</div>
          </div>
        </div>

        <!-- Stats -->
        <div class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">
            <v-icon start size="small">mdi-chart-bar</v-icon>
            {{ LL?.admin.userDetail?.stats() || '利用統計' }}
          </h3>
          <v-row>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ userDetail.stats.total_duels }}</div>
                <div class="text-caption">{{ LL?.admin.userDetail?.totalDuels() || '総対戦数' }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ userDetail.stats.this_month_duels }}</div>
                <div class="text-caption">{{ LL?.admin.userDetail?.thisMonthDuels() || '今月の対戦' }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-3">
                <div class="text-h5 font-weight-bold" :class="getWinRateColor(userDetail.stats.win_rate)">
                  {{ userDetail.stats.win_rate.toFixed(1) }}%
                </div>
                <div class="text-caption">{{ LL?.admin.userDetail?.winRate() || '勝率' }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">
                  {{ userDetail.stats.total_wins }}/{{ userDetail.stats.total_losses }}
                </div>
                <div class="text-caption">{{ LL?.admin.userDetail?.winLoss() || '勝敗' }}</div>
              </v-card>
            </v-col>
          </v-row>
          <v-row class="mt-2">
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.playerDecks() || '自分のデッキ' }}</div>
              <div>{{ userDetail.stats.player_decks_count }}件</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">{{ LL?.admin.userDetail?.opponentDecks() || '相手のデッキ' }}</div>
              <div>{{ userDetail.stats.opponent_decks_count }}件</div>
            </v-col>
          </v-row>
        </div>

        <!-- Feature Usage -->
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-3">
            <v-icon start size="small">mdi-puzzle</v-icon>
            {{ LL?.admin.userDetail?.featureUsage() || '機能利用状況' }}
          </h3>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              :color="userDetail.feature_usage.has_streamer_mode ? 'success' : 'default'"
              :variant="userDetail.feature_usage.has_streamer_mode ? 'flat' : 'outlined'"
              size="small"
            >
              <v-icon start size="small">
                {{ userDetail.feature_usage.has_streamer_mode ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              {{ LL?.admin.userDetail?.streamerMode() || '配信者モード' }}
            </v-chip>
            <v-chip
              :color="userDetail.feature_usage.has_obs_overlay ? 'success' : 'default'"
              :variant="userDetail.feature_usage.has_obs_overlay ? 'flat' : 'outlined'"
              size="small"
            >
              <v-icon start size="small">
                {{ userDetail.feature_usage.has_obs_overlay ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              {{ LL?.admin.userDetail?.obsOverlay() || 'OBSオーバーレイ' }}
            </v-chip>
            <v-chip
              :color="userDetail.feature_usage.has_shared_statistics ? 'success' : 'default'"
              :variant="userDetail.feature_usage.has_shared_statistics ? 'flat' : 'outlined'"
              size="small"
            >
              <v-icon start size="small">
                {{ userDetail.feature_usage.has_shared_statistics ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              {{ LL?.admin.userDetail?.sharedStats() || '統計共有' }}
            </v-chip>
            <v-chip
              :color="userDetail.feature_usage.has_screen_analysis ? 'success' : 'default'"
              :variant="userDetail.feature_usage.has_screen_analysis ? 'flat' : 'outlined'"
              size="small"
            >
              <v-icon start size="small">
                {{ userDetail.feature_usage.has_screen_analysis ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
              {{ LL?.admin.userDetail?.screenAnalysis() || '画面分析' }}
            </v-chip>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          color="warning"
          variant="outlined"
          @click="$emit('changeStatus', userDetail)"
          :disabled="loading"
        >
          <v-icon start>mdi-account-cog</v-icon>
          {{ LL?.admin.userDetail?.changeStatus() || '状態を変更' }}
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          @click="handleResetPassword"
          :loading="resettingPassword"
          :disabled="!userDetail.email"
        >
          <v-icon start>mdi-lock-reset</v-icon>
          {{ LL?.admin.userDetail?.resetPassword() || 'パスワードリセット' }}
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">
          {{ LL?.common.close() || '閉じる' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-else-if="loading">
      <v-card-text class="text-center pa-6">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-3">{{ LL?.common.loading() || '読み込み中...' }}</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useLocale } from '@/composables/useLocale';
import { useNotificationStore } from '@/stores/notification';
import { getAdminUserDetail, resetUserPassword } from '@/services/adminApi';
import type { UserDetailResponse } from '@/types/admin';

const props = defineProps<{
  modelValue: boolean;
  userId: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'changeStatus', user: UserDetailResponse): void;
}>();

const { LL } = useLocale();
const notificationStore = useNotificationStore();

const isVisible = ref(props.modelValue);
const userDetail = ref<UserDetailResponse | null>(null);
const loading = ref(false);
const resettingPassword = ref(false);

watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue;
  if (newValue && props.userId) {
    fetchUserDetail(props.userId);
  }
});

watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue);
  if (!newValue) {
    userDetail.value = null;
  }
});

async function fetchUserDetail(userId: number) {
  loading.value = true;
  try {
    userDetail.value = await getAdminUserDetail(userId);
  } catch (e) {
    notificationStore.error('ユーザー情報の取得に失敗しました');
    close();
  } finally {
    loading.value = false;
  }
}

async function handleResetPassword() {
  if (!userDetail.value) return;

  resettingPassword.value = true;
  try {
    const result = await resetUserPassword(userDetail.value.id);
    if (result.success) {
      notificationStore.success(result.message);
    } else {
      notificationStore.error(result.message);
    }
  } catch (e: any) {
    notificationStore.error(e.response?.data?.detail || 'パスワードリセットに失敗しました');
  } finally {
    resettingPassword.value = false;
  }
}

function close() {
  isVisible.value = false;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'deleted':
      return 'error';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return LL.value?.admin.userDetail?.statusActive() || '有効';
    case 'suspended':
      return LL.value?.admin.userDetail?.statusSuspended() || '停止中';
    case 'deleted':
      return LL.value?.admin.userDetail?.statusDeleted() || '削除済み';
    default:
      return status;
  }
}

function getWinRateColor(winRate: number) {
  if (winRate >= 60) return 'text-success';
  if (winRate >= 50) return 'text-primary';
  return 'text-error';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
