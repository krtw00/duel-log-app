import { setActivePinia, createPinia } from 'pinia'
import { useLoadingStore } from '../loading'
import { beforeEach, describe, expect, it } from 'vitest'

describe('loadingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initially have isLoading as false', () => {
    const loadingStore = useLoadingStore()
    expect(loadingStore.isLoading).toBe(false)
  })

  it('should set isLoading to true when start is called', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start('test-task')
    expect(loadingStore.isLoading).toBe(true)
  })

  it('should set isLoading to false when stop is called for the last task', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start('task1')
    loadingStore.start('task2')
    expect(loadingStore.isLoading).toBe(true)
    loadingStore.stop('task1')
    expect(loadingStore.isLoading).toBe(true) // Still loading for task2
    loadingStore.stop('task2')
    expect(loadingStore.isLoading).toBe(false)
  })

  it('should remain isLoading true if multiple tasks are active', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start('task1')
    loadingStore.start('task2')
    expect(loadingStore.isLoading).toBe(true)
    loadingStore.stop('task1')
    expect(loadingStore.isLoading).toBe(true)
  })

  it('should set isLoading to false when stopAll is called', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start('task1')
    loadingStore.start('task2')
    expect(loadingStore.isLoading).toBe(true)
    loadingStore.stopAll()
    expect(loadingStore.isLoading).toBe(false)
  })

  it('should handle non-existent taskIds gracefully', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start('task1')
    loadingStore.stop('non-existent-task')
    expect(loadingStore.isLoading).toBe(true)
    loadingStore.stop('task1')
    expect(loadingStore.isLoading).toBe(false)
  })

  it('should use "global" as default taskId', () => {
    const loadingStore = useLoadingStore()
    loadingStore.start() // default 'global'
    expect(loadingStore.isLoading).toBe(true)
    loadingStore.stop() // default 'global'
    expect(loadingStore.isLoading).toBe(false)
  })
})
