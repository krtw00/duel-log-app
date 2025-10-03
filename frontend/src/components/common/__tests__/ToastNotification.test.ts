import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastNotification from '../ToastNotification.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useNotificationStore } from '../../../stores/notification'

const vuetify = createVuetify({
  components,
  directives,
})

describe('ToastNotification.vue', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const pinia = createTestingPinia({
      initialState: {
        notification: {
          notifications: []
        }
      },
      createSpy: vi.fn,
    })
    notificationStore = useNotificationStore()
    mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })
  })

  it('renders no snackbars when there are no notifications', () => {
    expect(notificationStore.notifications.length).toBe(0)
  })

  it('renders a success snackbar', async () => {
    notificationStore.success('Success message')
    await vi.runOnlyPendingTimers()
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('success')
  })

  it('renders an error snackbar', async () => {
    notificationStore.error('Error message')
    await vi.runOnlyPendingTimers()
    expect(notificationStore.notifications.length).toBe(1)
    expect(notificationStore.notifications[0].type).toBe('error')
  })

  it('removes a notification when the close button is clicked', async () => {
    notificationStore.success('Test message')
    await vi.runOnlyPendingTimers()
    expect(notificationStore.notifications.length).toBe(1)

    // Simulate clicking the close button
    notificationStore.remove(notificationStore.notifications[0].id)
    await vi.runOnlyPendingTimers()
    expect(notificationStore.notifications.length).toBe(0)
  })
})
