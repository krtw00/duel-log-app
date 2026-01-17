<template>
  <v-card class="user-management-card">
    <v-card-title class="pa-6">
      <v-icon class="mr-2" color="primary">mdi-account-multiple</v-icon>
      <span class="text-h5">ユーザー管理</span>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
      <div class="d-flex flex-column flex-sm-row gap-4 mb-4">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="ユーザー検索"
          placeholder="ユーザー名またはメールで検索"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          @update:model-value="debouncedFetchUsers"
          class="flex-grow-1"
        />
        <v-switch
          v-model="adminOnly"
          label="管理者のみ表示"
          color="primary"
          hide-details
          @update:model-value="fetchUsers"
          class="flex-shrink-0"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :items-per-page="perPage"
        hide-default-footer
        class="elevation-1"
      >
        <template #item.id="{ item }">
          <span class="font-weight-medium">#{{ item.id }}</span>
        </template>

        <template #item.username="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-2" color="primary">
              <span class="text-white">{{ item.username.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <span>{{ item.username }}</span>
          </div>
        </template>

        <template #item.is_admin="{ item }">
          <v-chip v-if="item.is_admin" color="warning" size="small" variant="flat">
            <v-icon start size="small">mdi-shield-crown</v-icon>
            管理者
          </v-chip>
          <v-chip v-else color="default" size="small" variant="outlined"> 一般ユーザー </v-chip>
        </template>

        <template #item.createdat="{ item }">
          {{ formatDate(item.createdat) }}
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            :variant="item.status === 'active' ? 'flat' : 'outlined'"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn color="info" size="small" variant="outlined" @click="openUserDetail(item.id)">
              <v-icon size="small">mdi-account-details</v-icon>
            </v-btn>
            <v-btn
              :color="item.is_admin ? 'error' : 'primary'"
              size="small"
              variant="outlined"
              :loading="togglingUserId === item.id"
              @click="promptUpdateStatus(item, !item.is_admin)"
            >
              <v-icon start size="small">
                {{ item.is_admin ? 'mdi-shield-off' : 'mdi-shield-crown' }}
              </v-icon>
              {{ item.is_admin ? '権限を削除' : '管理者にする' }}
            </v-btn>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex justify-center align-center pa-4">
            <v-pagination
              v-model="page"
              :length="totalPages"
              :total-visible="7"
              @update:model-value="handlePageChange"
            />
          </div>
          <div class="text-center pb-4">
            <span class="text-caption">
              {{ totalUsers }}件中 {{ startIndex }}-{{ endIndex }}件を表示
            </span>
          </div>
        </template>

        <template #no-data>
          <div class="text-center pa-4">
            <v-icon size="64" color="grey">mdi-account-off</v-icon>
            <p class="text-h6 mt-2">ユーザーが見つかりません</p>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table>
    </v-card-text>

    <v-dialog v-model="isDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
          {{ dialogTitle }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          {{ dialogMessage }}
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelUpdate">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmUpdate">確認</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- User Detail Dialog -->
    <user-detail-dialog
      v-model="isDetailDialogVisible"
      :user-id="selectedUserId"
      @change-status="openStatusChangeFromDetail"
    />

    <!-- User Status Change Dialog -->
    <user-status-change-dialog
      v-model="isStatusChangeDialogVisible"
      :user="selectedUserForStatusChange"
      @status-changed="handleStatusChanged"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { createLogger } from '@/utils/logger';
import { getAdminUsers, updateUserAdminStatus } from '@/services/adminApi';
import type { UserAdminResponse, UserDetailResponse } from '@/types/admin';
import UserDetailDialog from './UserDetailDialog.vue';
import UserStatusChangeDialog from './UserStatusChangeDialog.vue';

const logger = createLogger('UserManagement');

// State
const users = ref<UserAdminResponse[]>([]);
const loading = ref(true);
const togglingUserId = ref<number | null>(null);

// Filters and Pagination
const searchQuery = ref('');
const adminOnly = ref(false);
const page = ref(1);
const perPage = ref(20);
const totalUsers = ref(0);
const sort = ref('id');
const order = ref('asc');

// Confirmation Dialog
const isDialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');
const pendingUpdate = ref<{ userId: number; isAdmin: boolean } | null>(null);

// User Detail Dialog
const isDetailDialogVisible = ref(false);
const selectedUserId = ref<number | null>(null);

// User Status Change Dialog
const isStatusChangeDialogVisible = ref(false);
const selectedUserForStatusChange = ref<UserDetailResponse | null>(null);

// Table Headers
const headers = [
  { title: 'ID', key: 'id', sortable: true, width: '80px' },
  { title: 'ユーザー名', key: 'username', sortable: true },
  { title: 'メールアドレス', key: 'email', sortable: true },
  { title: '権限', key: 'is_admin', sortable: true, width: '120px' },
  { title: '状態', key: 'status', sortable: true, width: '100px' },
  { title: '登録日', key: 'createdat', sortable: true, width: '120px' },
  { title: '操作', key: 'actions', sortable: false, width: '200px' },
];

// Computed
const totalPages = computed(() => Math.ceil(totalUsers.value / perPage.value));
const startIndex = computed(() => (page.value - 1) * perPage.value + 1);
const endIndex = computed(() => Math.min(page.value * perPage.value, totalUsers.value));

// API Calls
async function fetchUsers() {
  loading.value = true;
  try {
    const response = await getAdminUsers(
      page.value,
      perPage.value,
      sort.value,
      order.value,
      searchQuery.value || undefined,
      adminOnly.value || undefined,
    );
    users.value = response.users;
    totalUsers.value = response.total;
  } catch (e: any) {
    logger.error('Failed to fetch users');
  } finally {
    loading.value = false;
  }
}

// Debounced fetch for search input
let debounceTimer: number;
function debouncedFetchUsers() {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 500);
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchUsers();
}

function promptUpdateStatus(user: UserAdminResponse, newStatus: boolean) {
  togglingUserId.value = user.id;
  pendingUpdate.value = { userId: user.id, isAdmin: newStatus };
  dialogTitle.value = '管理者権限の変更';
  dialogMessage.value = `${user.username} を ${newStatus ? '管理者' : '一般ユーザー'} に変更しますか？`;
  isDialogVisible.value = true;
}

function cancelUpdate() {
  isDialogVisible.value = false;
  pendingUpdate.value = null;
  togglingUserId.value = null;
}

async function confirmUpdate() {
  if (!pendingUpdate.value) return;

  const { userId, isAdmin } = pendingUpdate.value;
  isDialogVisible.value = false;
  const notificationStore = useNotificationStore();

  try {
    const response = await updateUserAdminStatus(userId, isAdmin);
    if (response.success) {
      notificationStore.success('管理者権限を更新しました');
      await fetchUsers();
    }
  } catch (e: any) {
    // Error is handled by the global interceptor
  } finally {
    pendingUpdate.value = null;
    togglingUserId.value = null;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// User Detail Dialog functions
function openUserDetail(userId: number) {
  selectedUserId.value = userId;
  isDetailDialogVisible.value = true;
}

function openStatusChangeFromDetail(user: UserDetailResponse) {
  isDetailDialogVisible.value = false;
  selectedUserForStatusChange.value = user;
  isStatusChangeDialogVisible.value = true;
}

function handleStatusChanged(_user: UserDetailResponse) {
  fetchUsers();
}

// Status helpers
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
      return '有効';
    case 'suspended':
      return '停止中';
    case 'deleted':
      return '削除済み';
    default:
      return status;
  }
}

onMounted(fetchUsers);
</script>

<style scoped>
.user-management-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-4 {
  gap: 1rem;
}
</style>
