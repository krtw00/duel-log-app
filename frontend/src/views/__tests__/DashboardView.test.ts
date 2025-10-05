import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import DashboardView from '../DashboardView.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notification'
import { api } from '@/services/api'

// Mock API and stores
vi.mock('@/services/api')
vi.mock('../../stores/auth')
vi.mock('../../stores/notification')

const vuetify = createVuetify({
  components,
  directives,
})

describe('DashboardView.vue', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    authStore = useAuthStore()
    notificationStore = useNotificationStore()
    vi.clearAllMocks()

    // Mock authStore to be authenticated
    authStore.isAuthenticated = true
    authStore.user = { id: 1, email: 'test@example.com', username: 'testuser', streamer_mode: false }

    // Mock API calls for fetchDuels
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/decks/') {
        return Promise.resolve({ data: [] })
      }
      if (url === '/duels/') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error('Not mocked'))
    })
  })

  it('renders the dashboard view', () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
          ShareStatsDialog: true, // Stub the dialog
        },
      },
    })

    expect(wrapper.text()).toContain('対戦履歴')
    expect(wrapper.findComponent({ name: 'ShareStatsDialog' }).exists()).toBe(true)
  })

  it('opens the ShareStatsDialog when the "共有リンクを生成" button is clicked (PC)', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
          ShareStatsDialog: true, // Stub the dialog
        },
      },
    })

    // Find the PC version of the button
    const shareButton = wrapper.find('.d-sm-flex .v-btn[prepend-icon="mdi-share-variant"]')
    expect(shareButton.exists()).toBe(true)

    await shareButton.trigger('click')

    // Assert that the dialog component received modelValue as true
    expect(wrapper.findComponent({ name: 'ShareStatsDialog' }).props('modelValue')).toBe(true)
  })

  it('opens the ShareStatsDialog when the "共有" button is clicked (Mobile)', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
          ShareStatsDialog: true, // Stub the dialog
        },
      },
    })

    // Find the mobile version of the button
    const shareButton = wrapper.find('.d-sm-none .v-btn[prepend-icon="mdi-share-variant"]')
    expect(shareButton.exists()).toBe(true)

    await shareButton.trigger('click')

    // Assert that the dialog component received modelValue as true
    expect(wrapper.findComponent({ name: 'ShareStatsDialog' }).props('modelValue')).toBe(true)
  })
})