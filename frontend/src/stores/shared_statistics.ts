import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import { useNotificationStore } from './notification';
import { getErrorMessage } from '../utils/errorHandler';
import { getLL } from '../i18n';
import type {
  SharedStatisticsData,
  SharedStatisticsCreatePayload,
  SharedStatisticsReadPayload,
  SharedStatisticsResponse,
} from '../types';

/**
 * 共有統計取得のクエリパラメータ
 */
interface SharedStatisticsQueryParams {
  year: number;
  month: number;
  period_type?: string;
  range_start?: number;
  range_end?: number;
  my_deck_id?: number;
}

export const useSharedStatisticsStore = defineStore('sharedStatistics', () => {
  const notificationStore = useNotificationStore();
  const sharedStatsData = ref<SharedStatisticsData | null>(null);
  const loading = ref(false);

  const createSharedLink = async (
    payload: SharedStatisticsCreatePayload,
  ): Promise<string | null> => {
    loading.value = true;
    try {
      const response = await api.post<SharedStatisticsReadPayload>('/shared-statistics/', payload);
      const LL = getLL();
      notificationStore.success(LL?.shared.createSuccess() ?? 'Share link created!');
      return response.data.share_id;
    } catch (error: unknown) {
      const LL = getLL();
      notificationStore.error(
        getErrorMessage(error, LL?.shared.createError() ?? 'Failed to create share link.'),
      );
      return null;
    } finally {
      loading.value = false;
    }
  };

  const getSharedStatistics = async (
    shareId: string,
    year: number,
    month: number,
    filters?: {
      periodType?: string;
      rangeStart?: number | null;
      rangeEnd?: number | null;
      myDeckId?: number | null;
    },
  ): Promise<boolean> => {
    loading.value = true;
    sharedStatsData.value = null; // Clear previous data
    try {
      const params: SharedStatisticsQueryParams = {
        year: year,
        month: month,
      };

      // Add filter parameters if provided
      if (filters?.periodType) {
        params.period_type = filters.periodType;
      }
      if (filters?.rangeStart !== null && filters?.rangeStart !== undefined) {
        params.range_start = filters.rangeStart;
      }
      if (filters?.rangeEnd !== null && filters?.rangeEnd !== undefined) {
        params.range_end = filters.rangeEnd;
      }
      if (filters?.myDeckId !== null && filters?.myDeckId !== undefined) {
        params.my_deck_id = filters.myDeckId;
      }

      const response = await api.get<SharedStatisticsResponse>(`/shared-statistics/${shareId}`, {
        params,
      });
      sharedStatsData.value = response.data.statistics_data;
      return true;
    } catch (error: unknown) {
      const LL = getLL();
      notificationStore.error(
        getErrorMessage(error, LL?.shared.fetchError() ?? 'Failed to fetch shared statistics.'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  };

  const deleteSharedLink = async (shareId: string): Promise<boolean> => {
    loading.value = true;
    try {
      await api.delete(`/shared-statistics/${shareId}`);
      const LL = getLL();
      notificationStore.success(LL?.shared.deleteSuccess() ?? 'Share link deleted.');
      return true;
    } catch (error: unknown) {
      const LL = getLL();
      notificationStore.error(
        getErrorMessage(error, LL?.shared.deleteError() ?? 'Failed to delete share link.'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    sharedStatsData,
    loading,
    createSharedLink,
    getSharedStatistics,
    deleteSharedLink,
  };
});
