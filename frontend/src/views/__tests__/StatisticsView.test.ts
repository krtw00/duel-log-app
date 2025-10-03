import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatisticsView from '../StatisticsView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { api } from '@/services/api'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
  },
}))

// Mock VueApexCharts component
vi.mock('vue3-apexcharts', () => ({ default: { name: 'Apexchart', template: '<div class="apexchart-mock"></div>' } }))

describe('StatisticsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get = vi.fn((url) => {
      if (url.includes('monthly')) {
        return Promise.resolve({ data: [{ deck_name: 'Deck A', count: 10 }], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })
      }
      if (url.includes('recent')) {
        return Promise.resolve({ data: [{ deck_name: 'Deck B', count: 5 }], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })
      }
      if (url.includes('matchup')) {
        return Promise.resolve({ data: [{ my_deck_name: 'My Deck', opponent_deck_name: 'Opponent Deck', wins: 5, losses: 3, win_rate: 62.5 }], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })
      }
      return Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })
    })
  })

  it('renders correctly and fetches statistics on mount', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(api.get).toHaveBeenCalledWith('/statistics/deck-distribution/monthly')
    expect(api.get).toHaveBeenCalledWith('/statistics/deck-distribution/recent')
    expect(api.get).toHaveBeenCalledWith('/statistics/matchup-chart')

    await (wrapper.vm as any).$nextTick()
    await (wrapper.vm as any).$nextTick()

    expect(wrapper.find('h1').text()).toContain('統計情報')
    expect(wrapper.find('.apexchart-mock').exists()).toBe(true)
    expect(wrapper.find('.matchup-table').exists()).toBe(true)
  })

  it('displays no data message when no distribution data is available', async () => {
    api.get = vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })) // Mock empty data

    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).$nextTick()
    await (wrapper.vm as any).$nextTick()

    expect(wrapper.findAll('.no-data-placeholder').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('データがありません')
  })

  it('displays matchup data correctly', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).$nextTick()
    await (wrapper.vm as any).$nextTick()

    expect(wrapper.text()).toContain('My Deck')
    expect(wrapper.text()).toContain('Opponent Deck')
    expect(wrapper.text()).toContain('62.5%')
  })

  it('getWinRateColor returns correct color based on win rate', () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    expect((wrapper.vm as any).getWinRateColor(70)).toBe('success')
    expect((wrapper.vm as any).getWinRateColor(50)).toBe('warning')
    expect((wrapper.vm as any).getWinRateColor(30)).toBe('error')
  })
})
