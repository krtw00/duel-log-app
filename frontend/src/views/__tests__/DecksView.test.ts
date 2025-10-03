import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DecksView from '../DecksView.vue'
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

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
    post: vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
    put: vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
  },
}))

describe('DecksView.vue', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const _pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    notificationStore = useNotificationStore()
    vi.clearAllMocks()
    api.get = vi.fn(() => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))
    api.post = vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))
    api.put = vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))
    api.delete = vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))
  })

  it('renders correctly and fetches decks on mount', async () => {
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(api.get).toHaveBeenCalledWith('/decks/')
  })

  it('opens deck dialog in create mode for my deck', async () => {
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await wrapper.findAll('.add-btn')[0].trigger('click') // My deck add button
    expect((wrapper.vm as any).dialogOpen).toBe(true)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).isOpponentDeck).toBe(false)
    expect((wrapper.vm as any).deckName).toBe('')
  })

  it('opens deck dialog in create mode for opponent deck', async () => {
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await wrapper.findAll('.add-btn')[1].trigger('click') // Opponent deck add button
    expect((wrapper.vm as any).dialogOpen).toBe(true)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).isOpponentDeck).toBe(true)
    expect((wrapper.vm as any).deckName).toBe('')
  })

  it('opens deck dialog in edit mode', async () => {
    const mockDeck = { id: 1, name: 'Test Deck', is_opponent: false, createdat: '2023-01-01T00:00:00Z' }
    api.get = vi.fn(() => Promise.resolve({ data: [mockDeck], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))

    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).$nextTick() // Wait for fetchDecks
    await (wrapper.vm as any).$nextTick() // Wait for rendering

    await wrapper.find('.v-list-item__append .v-btn').trigger('click') // Edit button
    expect((wrapper.vm as any).dialogOpen).toBe(true)
    expect((wrapper.vm as any).isEdit).toBe(true)
    expect((wrapper.vm as any).isOpponentDeck).toBe(mockDeck.is_opponent)
    expect((wrapper.vm as any).deckName).toBe(mockDeck.name)
    expect((wrapper.vm as any).selectedDeckId).toBe(mockDeck.id)
  })

  it('calls API to create a deck and shows success notification', async () => {
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }) }
    ;(wrapper.vm as any).deckName = 'New Deck'
    ;(wrapper.vm as any).isOpponentDeck = false

    await (wrapper.vm as any).handleSubmit()

    expect(api.post).toHaveBeenCalledWith('/decks/', { name: 'New Deck', is_opponent: false })
    expect(notificationStore.success).toHaveBeenCalledWith('デッキを登録しました')
    expect((wrapper.vm as any).dialogOpen).toBe(false)
  })

  it('calls API to update a deck and shows success notification', async () => {
    const mockDeck = { id: 1, name: 'Old Deck', is_opponent: false, createdat: '2023-01-01T00:00:00Z' }
    api.get = vi.fn(() => Promise.resolve({ data: [mockDeck], status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))

    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).$nextTick() // Wait for fetchDecks
    await (wrapper.vm as any).$nextTick() // Wait for rendering

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }) }
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).selectedDeckId = mockDeck.id
    ;(wrapper.vm as any).deckName = 'Updated Deck'
    ;(wrapper.vm as any).isOpponentDeck = mockDeck.is_opponent

    await (wrapper.vm as any).handleSubmit()

    expect(api.put).toHaveBeenCalledWith('/decks/1', { name: 'Updated Deck', is_opponent: false })
    expect(notificationStore.success).toHaveBeenCalledWith('デッキを更新しました')
    expect((wrapper.vm as any).dialogOpen).toBe(false)
  })

  it('calls API to delete a deck and shows success notification', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).deleteDeck(1)

    expect(api.delete).toHaveBeenCalledWith('/decks/1')
    expect(notificationStore.success).toHaveBeenCalledWith('デッキを削除しました')
  })

  it('does not delete a deck if confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(DecksView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).deleteDeck(1)

    expect(api.delete).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
  })
})
