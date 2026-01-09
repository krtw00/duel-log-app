<template>
  <button @click="toggleAdminStatus" :disabled="isCurrentUser || busy">
    {{ user.is_admin ? '管理者から降格' : '管理者に昇格' }}
  </button>
</template>

<script setup lang="ts">
import type { UserAdminResponse } from '../../types/admin';

const props = defineProps<{
  user: UserAdminResponse;
  isCurrentUser: boolean;
  busy: boolean;
}>();

const emit = defineEmits(['toggle']);

function toggleAdminStatus() {
  emit('toggle', props.user);
}
</script>
