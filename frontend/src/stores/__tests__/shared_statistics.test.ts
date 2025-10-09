import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { useNotificationStore } from '../notification';
import { useSharedStatisticsStore } from '../shared_statistics';
import api from '../../services/api'; // This will be the mocked api

describe('sharedStatisticsStore', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>;
  let notificationStore: ReturnType<typeof useNotificationStore>;


  beforeEach(async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    vi.clearAllMocks();
    vi.spyOn(api, 'post').mockResolvedValue({});
    vi.spyOn(api, 'get').mockResolvedValue({});
    vi.spyOn(api, 'delete').mockResolvedValue({});
    sharedStatisticsStore = useSharedStatisticsStore(pinia);
    notificationStore = useNotificationStore(pinia);
  });

  it('initializes with null sharedStatsData and loading false', () => {
    expect(sharedStatisticsStore.sharedStatsData).toBeNull();
    expect(sharedStatisticsStore.loading).toBe(false);
  });

  describe('createSharedLink', () => {
    const mockPayload = {
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: '2023-11-01T00:00:00Z',
    };
    const mockResponse = {
      id: 1,
      share_id: 'test_share_id',
      user_id: 1,
      ...mockPayload,
      created_at: '2023-10-01T00:00:00Z',
    };
    const createLinkErrorMessage = 'Failed to create link';

    it('creates a shared link successfully', async () => {


      const shareId = await sharedStatisticsStore.createSharedLink(mockPayload);

      expect(api.post).toHaveBeenCalledWith('/shared-statistics/', mockPayload);
      expect(notificationStore.success).toHaveBeenCalledWith('共有リンクが生成されました！');
      expect(shareId).toBe('test_share_id');
      expect(sharedStatisticsStore.loading).toBe(false);
    });

    it('handles error during shared link creation', async () => {


      const shareId = await sharedStatisticsStore.createSharedLink(mockPayload);

      expect(api.post).toHaveBeenCalledWith('/shared-statistics/', mockPayload);
      expect(notificationStore.error).toHaveBeenCalledWith(createLinkErrorMessage);
      expect(shareId).toBeNull();
      expect(sharedStatisticsStore.loading).toBe(false);
    });
  });

  describe('getSharedStatistics', () => {
    const mockShareId = 'test_share_id';
    const mockStatsData = {
      RANK: {
        monthly_deck_distribution: [{ deck_name: 'Deck A', count: 10, percentage: 50 }],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: [],
      },
    };
    const fetchStatsErrorMessage = 'Failed to fetch stats';
    it('fetches shared statistics successfully', async () => {

      const success = await sharedStatisticsStore.getSharedStatistics(mockShareId, 2023, 10);

      expect(api.get).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`, {
        params: {
          year: 2023,
          month: 10,
        },
      });
      expect(success).toBe(true);
      expect(sharedStatisticsStore.loading).toBe(false);
    });

    it('handles error during shared statistics fetch', async () => {


      const success = await sharedStatisticsStore.getSharedStatistics(mockShareId, 2023, 10);

      expect(api.get).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`, {
        params: {
          year: 2023,
          month: 10,
        },
      });
      expect(notificationStore.error).toHaveBeenCalledWith(fetchStatsErrorMessage);
      expect(sharedStatisticsStore.sharedStatsData).toBeNull();
      expect(success).toBe(false);
      expect(sharedStatisticsStore.loading).toBe(false);
    });
  });

  describe('deleteSharedLink', () => {
    const mockShareId = 'test_share_id';
    const deleteLinkErrorMessage = 'Failed to delete link';

    it('deletes a shared link successfully', async () => {


      const success = await sharedStatisticsStore.deleteSharedLink(mockShareId);

      expect(mockApiDelete).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`);
      expect(notificationStore.success).toHaveBeenCalledWith('共有リンクが削除されました。');
      expect(success).toBe(true);
      expect(sharedStatisticsStore.loading).toBe(false);
    });

    it('handles error during shared link deletion', async () => {


      const success = await sharedStatisticsStore.deleteSharedLink(mockShareId);

      expect(mockApiDelete).toHaveBeenCalledWith(`/shared-statistics/${mockShareId}`);
      expect(notificationStore.error).toHaveBeenCalledWith(deleteLinkErrorMessage);
      expect(success).toBe(false);
      expect(sharedStatisticsStore.loading).toBe(false);
    });
  });
});