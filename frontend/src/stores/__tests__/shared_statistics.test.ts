import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSharedStatisticsStore } from '../shared_statistics'
import { useNotificationStore } from '../notification'
import { api } from '@/services/api'

vi.mock('@/services/api')
vi.mock('../notification') // Mock notification store as well

describe('sharedStatisticsStore', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sharedStatisticsStore = useSharedStatisticsStore()
    notificationStore = useNotificationStore()
  })

  it('initializes with null sharedStatsData and loading false', () => {
    expect(sharedStatisticsStore.sharedStatsData).toBeNull()
    expect(sharedStatisticsStore.loading).toBe(false)
  })

  describe('createSharedLink', () => {
    const mockPayload = {
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: '2023-11-01T00:00:00Z'
    }
    const mockResponse = {
      id: 1,
      share_id: 'test_share_id',
      user_id: 1,
      ...mockPayload,
      created_at: '2023-10-01T00:00:00Z'
    }

    it('creates a shared link successfully', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const shareId = await sharedStatisticsStore.createSharedLink(mockPayload)

      expect(api.post).toHaveBeenCalledWith('/shared-statistics/', mockPayload)
      expect(notificationStore.success).toHaveBeenCalledWith('共有リンクが生成されました！')
      expect(shareId).toBe('test_share_id')
      expect(sharedStatisticsStore.loading).toBe(false)
    })

    it('handles error during shared link creation', async () => {
      const errorMessage = 'Failed to create link'
      vi.mocked(api.post).mockRejectedValue({ response: { data: { detail: errorMessage } } })

      const shareId = await sharedStatisticsStore.createSharedLink(mockPayload)

      expect(api.post).toHaveBeenCalledWith('/shared-statistics/', mockPayload)
      expect(notificationStore.error).toHaveBeenCalledWith(errorMessage)
      expect(shareId).toBeNull()
      expect(sharedStatisticsStore.loading).toBe(false)
    })
  })

  describe('getSharedStatistics', () => {
    const mockShareId = 'test_share_id'
    const mockStatsData = {
      RANK: {
        monthly_deck_distribution: [{ deck_name: 'Deck A', count: 10, percentage: 50 }],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: []
      }
    }

    it('fetches shared statistics successfully', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockStatsData })

      const success = await sharedStatisticsStore.getSharedStatistics(mockShareId)

      expect(api.get).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`)
      expect(sharedStatisticsStore.sharedStatsData).toEqual(mockStatsData)
      expect(success).toBe(true)
      expect(sharedStatisticsStore.loading).toBe(false)
    })

    it('handles error during shared statistics fetch', async () => {
      const errorMessage = 'Failed to fetch stats'
      vi.mocked(api.get).mockRejectedValue({ response: { data: { detail: errorMessage } } })

      const success = await sharedStatisticsStore.getSharedStatistics(mockShareId)

      expect(api.get).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`)
      expect(notificationStore.error).toHaveBeenCalledWith(errorMessage)
      expect(sharedStatisticsStore.sharedStatsData).toBeNull()
      expect(success).toBe(false)
      expect(sharedStatisticsStore.loading).toBe(false)
    })
  })

  describe('deleteSharedLink', () => {
    const mockShareId = 'test_share_id'

    it('deletes a shared link successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue({})

      const success = await sharedStatisticsStore.deleteSharedLink(mockShareId)

      expect(api.delete).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`)
      expect(notificationStore.success).toHaveBeenCalledWith('共有リンクが削除されました。')
      expect(success).toBe(true)
      expect(sharedStatisticsStore.loading).toBe(false)
    })

    it('handles error during shared link deletion', async () => {
      const errorMessage = 'Failed to delete link'
      vi.mocked(api.delete).mockRejectedValue({ response: { data: { detail: errorMessage } } })

      const success = await sharedStatisticsStore.deleteSharedLink(mockShareId)

      expect(api.delete).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`)
      expect(notificationStore.error).toHaveBeenCalledWith(errorMessage)
      expect(success).toBe(false)
      expect(sharedStatisticsStore.loading).toBe(false)
    })
  })
})
