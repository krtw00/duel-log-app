<template>
  <tr>
    <td>{{ user.id }}</td>
    <td>{{ user.username }}</td>
    <td>{{ user.email }}</td>
    <td>
      <span v-if="user.is_admin">👑</span>
    </td>
    <td>{{ formattedCreatedAt }}</td>
    <td>
      <AdminToggleButton
        :user="user"
        :is-current-user="isCurrentUser"
        :busy="isToggling"
        @toggle="handleToggle"
      />
    </td>
  </tr>
</template>

import { computed } from 'vue';
import type { UserAdminResponse } from '../../types/admin';
import AdminToggleButton from './AdminToggleButton.vue';
import { useAuthStore } from '../../stores/auth';

const props = defineProps<{
  user: UserAdminResponse;
  isToggling: boolean;
}>();

const emit = defineEmits(['update-status']);

const authStore = useAuthStore();
const isCurrentUser = computed(() => authStore.user?.id === props.user.id);

const formattedCreatedAt = computed(() => {
  return new Date(props.user.createdat).toLocaleDateString();
});

function handleToggle() {
  emit('update-status', { user: props.user, newStatus: !props.user.is_admin });
}
</script>

<style scoped>
td {
  border: 1px solid #ddd;
  padding: 8px;
}
</style>
