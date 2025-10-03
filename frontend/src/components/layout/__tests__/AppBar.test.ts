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
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }
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

  it('calls logout when logout button is clicked', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    // Open the menu
    await wrapper.find('.v-chip').trigger('click')
    await wrapper.vm.$nextTick()

    // Click logout button (assuming it's the second list item)
    // This part might be brittle if the menu structure changes.
    // A more robust way would be to find the specific list item by its content or a test id.
    const logoutButton = wrapper.findAllComponents({ name: 'VListItem' }).filter(item => item.text().includes('ログアウト'))
    await logoutButton[0].trigger('click')

    expect(authStore.logout).toHaveBeenCalled()
  })

  it('navigates to profile when profile button is clicked', async () => {
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }
    const wrapper = mount(AppBar, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: ['RouterLink'],
      },
      props: {
        currentView: 'dashboard',
      },
    })

    // Open the menu
    await wrapper.find('.v-chip').trigger('click')
    await wrapper.vm.$nextTick()

    // Click profile button (assuming it's the first list item)
    const profileButton = wrapper.findAllComponents({ name: 'VListItem' }).filter(item => item.text().includes('プロフィール'))
    await profileButton[0].trigger('click')

    expect(router.push).toHaveBeenCalledWith('/profile')
  })
})
