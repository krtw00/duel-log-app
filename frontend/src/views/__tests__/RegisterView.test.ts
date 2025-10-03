import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterView from '../RegisterView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useNotificationStore } from '../../../stores/notification'
import { api } from '../../../services/api'
import { useRouter } from 'vue-router'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('RegisterView.vue', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>
  let router: ReturnType<typeof useRouter>

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    notificationStore = useNotificationStore()
    router = useRouter()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders correctly', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.app-title').text()).toContain('DUELLOG')
  })

  it('calls register on form submission with valid data', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    wrapper.vm.formRef = { validate: () => Promise.resolve({ valid: true }) }
    wrapper.vm.username = 'testuser'
    wrapper.vm.email = 'test@example.com'
    wrapper.vm.password = 'password123'
    wrapper.vm.passwordConfirm = 'password123'

    await wrapper.find('form').trigger('submit')

    expect(api.post).toHaveBeenCalledWith('/users/', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(notificationStore.success).toHaveBeenCalledWith('登録が完了しました。ログイン画面に移動します...')

    vi.advanceTimersByTime(2000)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('does not call register on form submission with invalid data', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    wrapper.vm.formRef = { validate: () => Promise.resolve({ valid: false }) }
    wrapper.vm.username = ''

    await wrapper.find('form').trigger('submit')

    expect(api.post).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
    })

    const passwordField = wrapper.find('input[label="パスワード"]')
    expect(passwordField.attributes().type).toBe('password')

    await wrapper.findAll('.v-field__append-inner .v-icon')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input[label="パスワード"]').attributes().type).toBe('text')
  })

  it('navigates to login page when login link is clicked', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: {
            template: '<a @click="$emit(\'click\')"><slot /></a>'
          }
        },
      },
    })

    await wrapper.find('.text-secondary').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/login')
  })
})
