import { describe, it, expect, beforeEach } from 'vitest'
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
  beforeEach(() => {
    // 各テスト前にストアをリセット
  })

  it('renders correctly', () => {
    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays notifications from store', () => {
    const pinia = createTestingPinia()
    const notificationStore = useNotificationStore(pinia)
    
    // 通知を追加
    notificationStore.notifications = [
      { id: '1', message: 'Test Success', type: 'success' }
    ]

    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    expect(wrapper.text()).toContain('Test Success')
  })

  it('displays multiple notifications', () => {
    const pinia = createTestingPinia()
    const notificationStore = useNotificationStore(pinia)
    
    notificationStore.notifications = [
      { id: '1', message: 'Success 1', type: 'success' },
      { id: '2', message: 'Error 1', type: 'error' }
    ]

    const wrapper = mount(ToastNotification, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    expect(wrapper.text()).toContain('Success 1')
    expect(wrapper.text()).toContain('Error 1')
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
})
