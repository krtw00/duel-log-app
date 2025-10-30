import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import { useNotificationStore } from './notification';
import { getErrorMessage } from '../utils/errorHandler';
import type {
  SharedStatisticsData,
  SharedStatisticsCreatePayload,
  SharedStatisticsReadPayload,
} from '../types';

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
      notificationStore.success('共有リンクが生成されました！');
      return response.data.share_id;
    } catch (error: unknown) {
      notificationStore.error(getErrorMessage(error, '共有リンクの生成に失敗しました。'));
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
      const params: Record<string, any> = {
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

      const response = await api.get<SharedStatisticsData>(`/shared-statistics/${shareId}`, {
        params,
      });
      sharedStatsData.value = response.data;
      return true;
    } catch (error: unknown) {
      notificationStore.error(getErrorMessage(error, '共有統計データの取得に失敗しました。'));
      return false;
    } finally {
      loading.value = false;
    }
  };

  const deleteSharedLink = async (shareId: string): Promise<boolean> => {
    loading.value = true;
    try {
      await api.delete(`/shared-statistics/${shareId}`);
      notificationStore.success('共有リンクが削除されました。');
      return true;
    } catch (error: unknown) {
      notificationStore.error(getErrorMessage(error, '共有リンクの削除に失敗しました。'));
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
