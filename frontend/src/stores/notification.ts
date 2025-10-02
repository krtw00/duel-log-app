import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  let nextId = 1

  const show = (
    type: Notification['type'],
    message: string,
    duration: number = 5000
  ) => {
    const id = nextId++
    notifications.value.push({ id, type, message, duration })

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  const success = (message: string, duration?: number) => {
    show('success', message, duration)
  }

  const error = (message: string, duration?: number) => {
    show('error', message, duration)
  }

  const warning = (message: string, duration?: number) => {
    show('warning', message, duration)
  }

  const info = (message: string, duration?: number) => {
    show('info', message, duration)
  }

  const remove = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  return {
    notifications,
    success,
    error,
    warning,
    info,
    remove
  }
})
