import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from '../DashboardView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { api } from '../../../services/api'
import { useNotificationStore } from '../../../stores/notification'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

describe('DashboardView.vue', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    notificationStore = useNotificationStore()
    vi.clearAllMocks()
    api.get = vi.fn(() => Promise.resolve({ data: [] }))
    api.delete = vi.fn(() => Promise.resolve())
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
    expect(api.get).toHaveBeenCalledWith('/decks/')
    expect(api.get).toHaveBeenCalledWith('/duels/')
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

    await wrapper.find('.add-btn').trigger('click')
    expect(wrapper.vm.dialogOpen).toBe(true)
    expect(wrapper.vm.selectedDuel).toBeNull()
  })

  it('opens duel dialog in edit mode', async () => {
    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponentDeck_id: 2,
      result: true,
      game_mode: 'RANK',
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

    wrapper.vm.editDuel(mockDuel)
    expect(wrapper.vm.dialogOpen).toBe(true)
    expect(wrapper.vm.selectedDuel).toEqual(mockDuel)
  })

  it('deletes a duel and shows success notification', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
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

    await wrapper.vm.deleteDuel(1)
    expect(api.delete).toHaveBeenCalledWith('/duels/1')
    expect(notificationStore.success).toHaveBeenCalledWith('対戦記録を削除しました')
    expect(api.get).toHaveBeenCalledTimes(4) // Initial fetch + re-fetch after delete
  })

  it('does not delete a duel if confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
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

    await wrapper.vm.deleteDuel(1)
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

    wrapper.vm.handleSaved()
    expect(wrapper.vm.dialogOpen).toBe(false)
    expect(api.get).toHaveBeenCalledTimes(4) // Initial fetch + re-fetch after save
  })

  it('calculates stats correctly', async () => {
    const mockDuels = [
      { id: 1, result: true, game_mode: 'RANK', coin: true, first_or_second: true },
      { id: 2, result: false, game_mode: 'RANK', coin: false, first_or_second: true },
      { id: 3, result: true, game_mode: 'RANK', coin: true, first_or_second: false },
      { id: 4, result: true, game_mode: 'RATE', coin: true, first_or_second: true },
    ] as any[]

    api.get = vi.fn((url) => {
      if (url === '/duels/') return Promise.resolve({ data: mockDuels })
      if (url === '/decks/') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
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

    const rankStats = wrapper.vm.rankStats
    expect(rankStats.total_duels).toBe(3)
    expect(rankStats.win_count).toBe(2)
    expect(rankStats.lose_count).toBe(1)
    expect(rankStats.win_rate).toBeCloseTo(2/3)
    expect(rankStats.coin_win_rate).toBeCloseTo(2/3)
    expect(rankStats.go_first_rate).toBeCloseTo(2/3)
    expect(rankStats.first_turn_win_rate).toBeCloseTo(1/2)
    expect(rankStats.second_turn_win_rate).toBeCloseTo(1/1)

    const rateStats = wrapper.vm.rateStats
    expect(rateStats.total_duels).toBe(1)
    expect(rateStats.win_count).toBe(1)
  })
})
