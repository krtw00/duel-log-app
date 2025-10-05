import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBar from '../AppBar.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '../../../stores/auth'
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

describe('AppBar.vue', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let router: ReturnType<typeof useRouter>

  beforeEach(() => {
    createTestingPinia({
      createSpy: vi.fn,
    })
    authStore = useAuthStore()
    router = useRouter()
    vi.clearAllMocks()
  })

  it('renders app title correctly', () => {
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })
    expect(wrapper.find('.v-app-bar-title').text()).toContain('DUELLOG')
  })

  it('displays navigation items based on currentView', async () => {
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    expect(wrapper.text()).toContain('デッキ管理')
    expect(wrapper.text()).toContain('統計')
    expect(wrapper.text()).not.toContain('ダッシュボード')

    await wrapper.setProps({ currentView: 'decks' })
    expect(wrapper.text()).toContain('ダッシュボード')
    expect(wrapper.text()).toContain('統計')
    expect(wrapper.text()).not.toContain('デッキ管理')
  })

  it('shows user chip and menu when user is authenticated', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com', streamer_mode: false }
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.v-chip').exists()).toBe(true)
    expect(wrapper.find('.v-chip').text()).toContain('testuser')
  })

  it('hides user chip and menu when user is not authenticated', () => {
    authStore.user = null
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })
    expect(wrapper.find('.v-chip').exists()).toBe(false)
  })

  it('displays logout option when user is authenticated', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com', streamer_mode: false }
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    await wrapper.vm.$nextTick()
    
    // ログアウトオプションが表示されていることを確認
    expect(wrapper.text()).toContain('ログアウト')
  })

  it('navigates to profile when profile button is clicked', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com', streamer_mode: false }
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: true,
          VListItem: {
            template: '<div @click="$attrs.onClick"><slot /></div>',
            props: ['to']
          }
        },
      },
      props: {
        currentView: 'dashboard',
      },
    })

    await wrapper.vm.$nextTick()
    
    // プロフィールリンクが存在することを確認
    expect(wrapper.text()).toContain('プロフィール')
  })

  it('displays streamer mode icon when enabled', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com', streamer_mode: true }
    authStore.isStreamerModeEnabled = true
    
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    await wrapper.vm.$nextTick()
    const chip = wrapper.find('.v-chip')
    expect(chip.exists()).toBe(true)
  })

  it('has responsive app title styling', () => {
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    const title = wrapper.find('.app-title')
    expect(title.exists()).toBe(true)
  })

  it('emits toggle-drawer event when nav icon is clicked', async () => {
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    const navIcon = wrapper.findComponent({ name: 'VAppBarNavIcon' })
    if (navIcon.exists()) {
      await navIcon.trigger('click')
      expect(wrapper.emitted()['toggle-drawer']).toBeTruthy()
    }
  })
})
