import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import SharedStatisticsView from '../SharedStatisticsView.vue'
import { useSharedStatisticsStore } from '../../stores/shared_statistics'
import { useNotificationStore } from '../../stores/notification'
import { useRouter, useRoute } from 'vue-router'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: { share_id: 'test_share_id' },
  })),
}))

const vuetify = createVuetify({
  components,
  directives,
})

describe('SharedStatisticsView.vue', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    sharedStatisticsStore = useSharedStatisticsStore()
    notificationStore = useNotificationStore()
    vi.clearAllMocks()
    // Reset mock for useRoute for each test
    vi.mocked(useRoute).mockReturnValue({ params: { share_id: 'test_share_id' } } as any)
  })

  it('renders correctly with a simple app bar', () => {
    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          apexchart: true, // Stub apexchart
        },
      },
    })
    expect(wrapper.find('.v-app-bar').exists()).toBe(true)
    expect(wrapper.find('.v-toolbar-title').text()).toContain('Duel Log Shared Statistics')
  })

  it('fetches and displays shared statistics on mount', async () => {
    const mockStatsData = {
      RANK: {
        year: 2023,
        month: 10,
        monthly_deck_distribution: [{ deck_name: 'Deck A', count: 10, percentage: 50 }],
        recent_deck_distribution: [{ deck_name: 'Deck B', count: 5, percentage: 100 }],
        matchup_data: [{ deck_name: 'My Deck', opponent_deck_name: 'Opp Deck', total_duels: 20, wins: 15, losses: 5, win_rate: 75 }],
        time_series_data: [],
      }
    }
    sharedStatisticsStore.getSharedStatistics.mockResolvedValue(true)
    sharedStatisticsStore.sharedStatsData = mockStatsData

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          apexchart: true, // Stub apexchart
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(sharedStatisticsStore.getSharedStatistics).toHaveBeenCalledWith('test_share_id')
    expect(wrapper.text()).toContain('共有統計データ')
    expect(wrapper.text()).toContain('ランク - 2023年 10月')
    expect(wrapper.text()).toContain('相手デッキ分布 (月間)')
    expect(wrapper.text()).toContain('Deck A')
    expect(wrapper.text()).toContain('直近30戦デッキ分布')
    expect(wrapper.text()).toContain('デッキ相性表')
    expect(wrapper.text()).toContain('My Deck')

    // Assert that apexchart components are rendered
    expect(wrapper.findAllComponents({ name: 'apexchart' }).length).toBeGreaterThan(0)
    // Assert that v-data-table is rendered
    expect(wrapper.find('.v-data-table').exists()).toBe(true)
  })

  it('displays error message if shared statistics fetch fails', async () => {
    sharedStatisticsStore.getSharedStatistics.mockResolvedValue(false)
    sharedStatisticsStore.loading = false // Simulate loading finished

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          apexchart: true, // Stub apexchart
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(sharedStatisticsStore.getSharedStatistics).toHaveBeenCalledWith('test_share_id')
    expect(wrapper.text()).toContain('共有統計データを読み込めませんでした。リンクが有効期限切れか、存在しない可能性があります。')
  })

  it('displays loading state', async () => {
    sharedStatisticsStore.loading = true
    sharedStatisticsStore.getSharedStatistics.mockResolvedValue(true) // Will resolve after loading

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          apexchart: true, // Stub apexchart
        },
      },
    })

    expect(wrapper.find('.shared-stats-card').attributes('loading')).toBeDefined()
  })
})
