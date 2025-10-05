import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileView from '../ProfileView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/services/api')

describe('ProfileView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const pinia = createTestingPinia()
    const authStore = useAuthStore(pinia)
    authStore.user = { 
      id: 1, 
      email: 'test@example.com', 
      username: 'testuser',
      streamer_mode: false
    }

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: ['AppBar'],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('プロフィール')
  })

  it('displays user information in form', () => {
    const pinia = createTestingPinia()
    const authStore = useAuthStore(pinia)
    authStore.user = { 
      id: 1, 
      email: 'test@example.com', 
      username: 'testuser',
      streamer_mode: false
    }

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: ['AppBar'],
      },
    })

    // フォームフィールドのラベルが存在することを確認
    expect(wrapper.text()).toContain('ユーザー名')
    expect(wrapper.text()).toContain('メールアドレス')
  })

  it('has streamer mode toggle', () => {
    const pinia = createTestingPinia()
    const authStore = useAuthStore(pinia)
    authStore.user = { 
      id: 1, 
      email: 'test@example.com', 
      username: 'testuser',
      streamer_mode: false
    }

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: ['AppBar'],
      },
    })

    expect(wrapper.text()).toContain('配信者モード')
  })
})
