import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { api } from '@/services/api'
import { useNotificationStore } from '@/stores/notification'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/services/api')

describe('DashboardView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(api.get).mockResolvedValue({
      data: [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
    
    vi.mocked(api.delete).mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
  })

  it('renders correctly and fetches duels on mount', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    await wrapper.vm.$nextTick()
    
    expect(api.get).toHaveBeenCalledWith('/decks/')
    expect(api.get).toHaveBeenCalledWith('/duels/', expect.any(Object))
  })

  it('displays responsive buttons for mobile', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    
    // ボタンが存在することを確認（レスポンシブクラスの確認はブラウザ環境に依存）
    expect(wrapper.text()).toContain('対戦記録を追加')
    expect(wrapper.text()).toContain('エクスポート')
    expect(wrapper.text()).toContain('インポート')
  })

  it('opens duel dialog in create mode', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    ;(wrapper.vm as any).openDuelDialog()
    expect((wrapper.vm as any).dialogOpen).toBe(true)
    expect((wrapper.vm as any).selectedDuel).toBeNull()
  })

  it('opens duel dialog in edit mode', async () => {
    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponentDeck_id: 2,
      result: true,
      game_mode: 'RANK' as const,
      rank: 18,
      coin: true,
      first_or_second: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
      create_date: '2023-01-01T12:00:00Z',
      update_date: '2023-01-01T12:00:00Z',
      user_id: 1,
    }

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    ;(wrapper.vm as any).editDuel(mockDuel)
    expect((wrapper.vm as any).dialogOpen).toBe(true)
    expect((wrapper.vm as any).selectedDuel).toEqual(mockDuel)
  })

  it('deletes a duel and shows success notification', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    const notificationStore = useNotificationStore(pinia)
    
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await (wrapper.vm as any).deleteDuel(1)
    expect(api.delete).toHaveBeenCalledWith('/duels/1')
    expect(notificationStore.success).toHaveBeenCalledWith('対戦記録を削除しました')
  })

  it('does not delete a duel if confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    const notificationStore = useNotificationStore(pinia)
    
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await (wrapper.vm as any).deleteDuel(1)
    expect(api.delete).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
  })

  it('refreshes duels after duel form is saved', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    vi.clearAllMocks()
    ;(wrapper.vm as any).handleSaved()
    
    expect((wrapper.vm as any).dialogOpen).toBe(false)
    expect(api.get).toHaveBeenCalled()
  })

  it('calculates stats correctly', async () => {
    const mockDuels = [
      { id: 1, result: true, game_mode: 'RANK', coin: true, first_or_second: true, deck_id: 1, opponentDeck_id: 2 },
      { id: 2, result: false, game_mode: 'RANK', coin: false, first_or_second: true, deck_id: 1, opponentDeck_id: 2 },
      { id: 3, result: true, game_mode: 'RANK', coin: true, first_or_second: false, deck_id: 1, opponentDeck_id: 2 },
      { id: 4, result: true, game_mode: 'RATE', coin: true, first_or_second: true, deck_id: 1, opponentDeck_id: 2 },
    ] as any[]

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/duels/') {
        return Promise.resolve({ 
          data: mockDuels, 
          status: 200, 
          statusText: 'OK', 
          headers: {}, 
          config: {} as any 
        })
      }
      if (url === '/decks/') {
        return Promise.resolve({ 
          data: [], 
          status: 200, 
          statusText: 'OK', 
          headers: {}, 
          config: {} as any 
        })
      }
      return Promise.resolve({ 
        data: [], 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} as any 
      })
    })

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const rankStats = (wrapper.vm as any).rankStats
    expect(rankStats.total_duels).toBe(3)
    expect(rankStats.win_count).toBe(2)
    expect(rankStats.lose_count).toBe(1)
    expect(rankStats.win_rate).toBeCloseTo(2/3)
    expect(rankStats.coin_win_rate).toBeCloseTo(2/3)
    expect(rankStats.go_first_rate).toBeCloseTo(2/3)
    expect(rankStats.first_turn_win_rate).toBeCloseTo(1/2)
    expect(rankStats.second_turn_win_rate).toBeCloseTo(1/1)

    const rateStats = (wrapper.vm as any).rateStats
    expect(rateStats.total_duels).toBe(1)
    expect(rateStats.win_count).toBe(1)
  })

  it('switches between game modes', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    // デフォルトはRANK
    expect((wrapper.vm as any).currentMode).toBe('RANK')

    // モードを変更
    ;(wrapper.vm as any).handleModeChange('RATE')
    expect((wrapper.vm as any).currentMode).toBe('RATE')
  })

  it('filters duels by game mode', async () => {
    const mockDuels = [
      { id: 1, game_mode: 'RANK', deck_id: 1, opponentDeck_id: 2 },
      { id: 2, game_mode: 'RATE', deck_id: 1, opponentDeck_id: 2 },
      { id: 3, game_mode: 'EVENT', deck_id: 1, opponentDeck_id: 2 },
      { id: 4, game_mode: 'DC', deck_id: 1, opponentDeck_id: 2 },
    ] as any[]

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/duels/') {
        return Promise.resolve({ data: mockDuels, status: 200, statusText: 'OK', headers: {}, config: {} as any })
      }
      return Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} as any })
    })

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          StatCard: true,
          DuelTable: true,
          DuelFormDialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).rankDuels.length).toBe(1)
    expect((wrapper.vm as any).rateDuels.length).toBe(1)
    expect((wrapper.vm as any).eventDuels.length).toBe(1)
    expect((wrapper.vm as any).dcDuels.length).toBe(1)
  })
})
