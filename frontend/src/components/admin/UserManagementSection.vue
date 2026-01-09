<template>
  <section>
    <h2>ユーザー管理</h2>

    <div class="controls">
      <UserSearchBar v-model="searchQuery" @update:model-value="debouncedFetchUsers" />
      <UserFilters v-model="adminOnly" @update:model-value="fetchUsers" />
    </div>

    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <template v-if="!loading && !error">
      <UserTable
        ref="userTable"
        :users="users"
        @update-user-status="promptUpdateStatus"
      />
      <Pagination
        :current-page="page"
        :per-page="perPage"
        :total="totalUsers"
        @page-changed="handlePageChange"
      />
    </template>

    <ConfirmAdminChangeDialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      :message="dialogMessage"
      @cancel="cancelUpdate"
      @confirm="confirmUpdate"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useNotificationStore } from '../../stores/notification';
import UserTable from './UserTable.vue';
import UserSearchBar from './UserSearchBar.vue';
import UserFilters from './UserFilters.vue';
import Pagination from './Pagination.vue';
import ConfirmAdminChangeDialog from './ConfirmAdminChangeDialog.vue';
import { getAdminUsers, updateUserAdminStatus } from '../../services/adminApi';
import type { UserAdminResponse } from '../../types/admin';

// Component Refs
const userTable = ref<InstanceType<typeof UserTable> | null>(null);

// State
const users = ref<UserAdminResponse[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

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

// API Calls
async function fetchUsers() {
  loading.value = true;
  error.value = null;
  try {
    const response = await getAdminUsers(
      page.value,
      perPage.value,
      sort.value,
      order.value,
      searchQuery.value,
      adminOnly.value
    );
    users.value = response.users;
    totalUsers.value = response.total;
  } catch (e: any) {
    error.value = e.message || 'ユーザーの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

// Debounced fetch for search input
let debounceTimer: number;
function debouncedFetchUsers() {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    page.value = 1; // Reset to first page on search
    fetchUsers();
  }, 500);
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchUsers();
}

function promptUpdateStatus({ user, newStatus }: { user: UserAdminResponse, newStatus: boolean }) {
  const userToUpdate = users.value.find(u => u.id === user.id);
  if (!userToUpdate) return;

  pendingUpdate.value = { userId: user.id, isAdmin: newStatus };
  dialogTitle.value = '管理者権限の変更';
  dialogMessage.value = `${userToUpdate.username} を ${newStatus ? '管理者' : '一般ユーザー'} に変更しますか？`;
  isDialogVisible.value = true;
}

function cancelUpdate() {
  isDialogVisible.value = false;
  pendingUpdate.value = null;
  userTable.value?.clearTogglingState();
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
      // Refresh the list
      await fetchUsers();
    }
  } catch (e: any) {
    // Error is handled by the global interceptor
  } finally {
    pendingUpdate.value = null;
    userTable.value?.clearTogglingState();
  }
}

onMounted(fetchUsers);
</script>

<style scoped>
section {
  padding: 1rem;
}
.controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.loading, .error {
  text-align: center;
  padding: 2rem;
}
.error {
  color: #dc3545;
}
</style>
