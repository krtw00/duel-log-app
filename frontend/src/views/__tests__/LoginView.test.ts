import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginView from '../LoginView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('LoginView.vue', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let notificationStore: ReturnType<typeof useNotificationStore>
  let router: ReturnType<typeof useRouter>

  beforeEach(() => {
    createTestingPinia({
      createSpy: vi.fn,
    })
    authStore = useAuthStore()
    notificationStore = useNotificationStore()
    router = useRouter()
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.app-title').text()).toContain('DUELLOG')
  })

  it('calls login on form submission with valid data', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }) }
    ;(wrapper.vm as any).email = 'test@example.com'
    ;(wrapper.vm as any).password = 'password123'

    await wrapper.find('form').trigger('submit')

    expect(authStore.login).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(notificationStore.success).toHaveBeenCalledWith('ログインに成功しました')
  })

  it('does not call login on form submission with invalid data', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: false }) }
    ;(wrapper.vm as any).email = 'invalid-email'
    ;(wrapper.vm as any).password = 'short'

    await wrapper.find('form').trigger('submit')

    expect(authStore.login).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
  })

  it('shows password when eye icon is clicked', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    const passwordField = wrapper.find('input[type="password"]')
    expect(passwordField.attributes().type).toBe('password')

    await wrapper.find('.v-field__append-inner .v-icon').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('navigates to register page when register link is clicked', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: {
            template: '<a @click="$emit(\'click\'"><slot /></a>'
          }
        },
      },
    })

    await wrapper.find('.text-secondary').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/register')
  })
})
