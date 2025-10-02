import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const loadingTasks = ref(new Set<string>())
  
  const isLoading = computed(() => loadingTasks.value.size > 0)

  const start = (taskId: string = 'global') => {
    loadingTasks.value.add(taskId)
  }

  const stop = (taskId: string = 'global') => {
    loadingTasks.value.delete(taskId)
  }

  const stopAll = () => {
    loadingTasks.value.clear()
  }

  return {
    isLoading,
    start,
    stop,
    stopAll
  }
})
