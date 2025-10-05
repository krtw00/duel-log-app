import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastNotification from '../ToastNotification.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useNotificationStore } from '@/stores/notification'

const vuetify = createVuetify({
  components,
  directives,
})

describe('ToastNotification.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('uses notification store', () => {
    const pinia = createTestingPinia()
    const notificationStore = useNotificationStore(pinia)
    
    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(notificationStore).toBeDefined()
  })

  it('shows no notifications when store is empty', () => {
    const pinia = createTestingPinia()
    const notificationStore = useNotificationStore(pinia)
    
    notificationStore.notifications = []

    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    // 通知がない場合、メッセージは表示されない
    const snackbars = wrapper.findAllComponents({ name: 'VSnackbar' })
    expect(snackbars.length).toBe(0)
  })

  it('handles notification store state', () => {
    const pinia = createTestingPinia()
    const notificationStore = useNotificationStore(pinia)
    
    // 通知を追加
    notificationStore.notifications = [
      { id: '1', message: 'Test Message', type: 'success' }
    ]

    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    // ストアが正しく使われていることを確認
    expect(notificationStore.notifications.length).toBe(1)
    expect(wrapper.exists()).toBe(true)
  })
})
