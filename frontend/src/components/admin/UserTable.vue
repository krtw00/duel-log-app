<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>ユーザー名</th>
          <th>メールアドレス</th>
          <th>管理者</th>
          <th>登録日</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <UserRow
          v-for="user in users"
          :key="user.id"
          :user="user"
          :is-toggling="user.id === togglingUserId"
          @update-status="handleUpdateStatus"
        />
        <tr v-if="users.length === 0">
          <td colspan="6">ユーザーが見つかりません。</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UserAdminResponse } from '../../types/admin';
import UserRow from './UserRow.vue';

defineProps<{
  users: UserAdminResponse[];
}>();

const emit = defineEmits(['update-user-status']);

const togglingUserId = ref<number | null>(null);

async function handleUpdateStatus({ user, newStatus }: { user: UserAdminResponse, newStatus: boolean }) {
  togglingUserId.value = user.id;
  try {
    emit('update-user-status', { userId: user.id, isAdmin: newStatus });
  } finally {
    // The parent component will clear this after the API call
  }
}

// This function will be called by the parent component
function clearTogglingState() {
  togglingUserId.value = null;
}

defineExpose({
  clearTogglingState,
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f2f2f2;
}
</style>
