import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '../notification'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('notificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers() // タイマーをモック化
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers() // タイマーを元に戻す
  })

  it('should initially have no notifications', () => {
    const notificationStore = useNotificationStore()
    expect(notificationStore.notifications).toEqual([])
  })

  it('should add a success notification', () => {
    const notificationStore = useNotificationStore()
    notificationStore.success('Success message')
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('success')
    expect(notificationStore.notifications[0].message).toBe('Success message')
  })

  it('should add an error notification', () => {
    const notificationStore = useNotificationStore()
    notificationStore.error('Error message')
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('error')
    expect(notificationStore.notifications[0].message).toBe('Error message')
  })

  it('should add a warning notification', () => {
    const notificationStore = useNotificationStore()
    notificationStore.warning('Warning message')
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('warning')
    expect(notificationStore.notifications[0].message).toBe('Warning message')
  })

  it('should add an info notification', () => {
    const notificationStore = useNotificationStore()
    notificationStore.info('Info message')
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('info')
    expect(notificationStore.notifications[0].message).toBe('Info message')
  })

  it('should remove a notification after its duration', async () => {
    const notificationStore = useNotificationStore()
    notificationStore.success('Temporary message', 1000)
    expect(notificationStore.notifications.length).toBe(1)

    vi.advanceTimersByTime(1000) // 1秒進める

    expect(notificationStore.notifications.length).toBe(0)
  })

  it('should not remove a notification if duration is 0', () => {
    const notificationStore = useNotificationStore()
    notificationStore.success('Persistent message', 0)
    expect(notificationStore.notifications.length).toBe(1)

    vi.advanceTimersByTime(5000) // 5秒進める

    expect(notificationStore.notifications.length).toBe(1) // 削除されない
  })

  it('should remove a specific notification by id', () => {
    const notificationStore = useNotificationStore()
    notificationStore.success('Message 1')
    notificationStore.error('Message 2')
    const notificationToRemove = notificationStore.notifications[0]

    expect(notificationStore.notifications.length).toBe(2)
    notificationStore.remove(notificationToRemove.id)
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].message).toBe('Message 2')
  })
})
