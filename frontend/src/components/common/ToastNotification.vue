<template>
  <v-snackbar
    v-for="notification in notifications"
    :key="notification.id"
    v-model="snackbarStates[notification.id]"
    :color="getColor(notification.type)"
    :timeout="notification.duration || 5000"
    location="top right"
    @update:model-value="(val) => !val && removeNotification(notification.id)"
    class="toast-notification"
  >
    <div class="d-flex align-center">
      <v-icon :icon="getIcon(notification.type)" class="mr-3" />
      <span>{{ notification.message }}</span>
    </div>

    <template #actions>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="removeNotification(notification.id)"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

const snackbarStates = ref<Record<number, boolean>>({})

// 新しい通知が追加されたらsnackbarを開く
watch(
  notifications,
  (newNotifications) => {
    newNotifications.forEach(notification => {
      if (!(notification.id in snackbarStates.value)) {
        snackbarStates.value[notification.id] = true
      }
    })
  },
  { deep: true }
)

const getColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'primary'
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-bell'
  }
}

const removeNotification = (id: number) => {
  snackbarStates.value[id] = false
  notificationStore.remove(id)
}
</script>

<style scoped lang="scss">
.toast-notification {
  :deep(.v-snackbar__wrapper) {
    min-width: 300px;
    max-width: 500px;
  }
}
</style>
