<template>
  <v-dialog v-model="isVisible" max-width="500">
    <v-card v-if="user">
      <v-card-title class="pa-6">
        <v-icon class="mr-2" color="warning">mdi-account-cog</v-icon>
        {{ LL?.admin.userDetail?.changeStatusTitle() || 'アカウント状態の変更' }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <p class="mb-4">
          {{
            LL?.admin.userDetail?.changeStatusDescription({ username: user.username }) ||
            `${user.username} の状態を変更します。`
          }}
        </p>

        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          :label="LL?.admin.userDetail?.newStatus() || '新しい状態'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        >
          <template #item="{ item, props }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :color="getStatusColor(item.value)" class="mr-2">
                  {{ getStatusIcon(item.value) }}
                </v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <v-textarea
          v-model="reason"
          :label="LL?.admin.userDetail?.reason() || '理由（任意）'"
          :placeholder="
            LL?.admin.userDetail?.reasonPlaceholder() || '状態変更の理由を入力してください'
          "
          variant="outlined"
          density="comfortable"
          rows="3"
          counter
          maxlength="500"
        />

        <v-alert
          v-if="selectedStatus === 'suspended'"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{
            LL?.admin.userDetail?.suspendedWarning() ||
            'アカウントを停止すると、ユーザーはログインできなくなります。'
          }}
        </v-alert>

        <v-alert
          v-if="selectedStatus === 'deleted'"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{
            LL?.admin.userDetail?.deletedWarning() ||
            'アカウントを削除扱いにすると、復旧が必要になります。'
          }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close" :disabled="loading">
          {{ LL?.common.cancel() || 'キャンセル' }}
        </v-btn>
        <v-btn
          :color="getStatusColor(selectedStatus)"
          variant="flat"
          @click="confirmChange"
          :loading="loading"
          :disabled="selectedStatus === user.status"
        >
          {{ LL?.common.confirm() || '確認' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useLocale } from '@/composables/useLocale';
import { useNotificationStore } from '@/stores/notification';
import { updateUserStatus } from '@/services/adminApi';
import type { UserDetailResponse, UpdateUserStatusRequest } from '@/types/admin';

const props = defineProps<{
  modelValue: boolean;
  user: UserDetailResponse | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'statusChanged', user: UserDetailResponse): void;
}>();

const { LL } = useLocale();
const notificationStore = useNotificationStore();

const isVisible = ref(props.modelValue);
const selectedStatus = ref<UpdateUserStatusRequest['status']>('active');
const reason = ref('');
const loading = ref(false);

const statusOptions = computed(() => [
  {
    value: 'active' as const,
    label: LL.value?.admin.userDetail?.statusActive() || '有効',
  },
  {
    value: 'suspended' as const,
    label: LL.value?.admin.userDetail?.statusSuspended() || '停止中',
  },
  {
    value: 'deleted' as const,
    label: LL.value?.admin.userDetail?.statusDeleted() || '削除済み',
  },
]);

watch(
  () => props.modelValue,
  (newValue) => {
    isVisible.value = newValue;
    if (newValue && props.user) {
      selectedStatus.value = props.user.status as UpdateUserStatusRequest['status'];
      reason.value = props.user.status_reason || '';
    }
  },
);

watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue);
  if (!newValue) {
    reason.value = '';
  }
});

async function confirmChange() {
  if (!props.user) return;

  loading.value = true;
  try {
    const result = await updateUserStatus(
      props.user.id,
      selectedStatus.value,
      reason.value || undefined,
    );
    if (result.success) {
      notificationStore.success(result.message);
      emit('statusChanged', result.user);
      close();
    }
  } catch (e: any) {
    notificationStore.error(e.response?.data?.detail || '状態の変更に失敗しました');
  } finally {
    loading.value = false;
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return 'mdi-check-circle';
    case 'suspended':
      return 'mdi-pause-circle';
    case 'deleted':
      return 'mdi-close-circle';
    default:
      return 'mdi-help-circle';
  }
}
</script>
