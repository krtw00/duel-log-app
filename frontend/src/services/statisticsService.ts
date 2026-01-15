/**
 * 統計API サービス
 * /statistics, /shared-statistics エンドポイントへのAPI呼び出しを集約
 */

import { api } from './api';
import type { GameMode, Deck } from '../types';
import type {
  StatisticsResponse,
  MultiModeStatisticsResponse,
  StatisticsQueryParams,
} from '../types/statistics';

/** 利用可能デッキレスポンス */
export interface AvailableDecksResponse {
  my_decks: Deck[];
  opponent_decks: Deck[];
}

/**
 * 統計データを取得
 */
export const getStatistics = async (
  params: StatisticsQueryParams,
): Promise<StatisticsResponse | MultiModeStatisticsResponse> => {
  const queryParams: Record<string, string | number> = {
    year: params.year,
    month: params.month,
  };

  if (params.range_start !== undefined) {
    queryParams.range_start = params.range_start;
  }
  if (params.range_end !== undefined) {
    queryParams.range_end = params.range_end;
  }
  if (params.my_deck_id !== undefined && params.my_deck_id !== null) {
    queryParams.my_deck_id = params.my_deck_id;
  }
  if (params.opponent_deck_id !== undefined && params.opponent_deck_id !== null) {
    queryParams.opponent_deck_id = params.opponent_deck_id;
  }
  if (params.game_mode) {
    queryParams.game_mode = params.game_mode;
  }

  const response = await api.get<StatisticsResponse | MultiModeStatisticsResponse>('/statistics', {
    params: queryParams,
  });
  return response.data;
};

/**
 * 利用可能なデッキ一覧を取得（統計フィルター用）
 */
export const getAvailableDecks = async (params: {
  year: number;
  month: number;
  game_mode?: GameMode;
}): Promise<AvailableDecksResponse> => {
  const response = await api.get<AvailableDecksResponse>('/statistics/available-decks', {
    params,
  });
  return response.data;
};

/**
 * 共有統計データを削除
 */
export const deleteSharedStatistics = async (shareId: string): Promise<void> => {
  await api.delete(`/shared-statistics/${shareId}`);
};

/**
 * 共有統計をCSVとしてエクスポート
 */
export const exportSharedStatisticsToCSV = async (shareId: string): Promise<Blob> => {
  const response = await api.get(`/shared-statistics/${shareId}/export/csv`, {
    responseType: 'blob',
  });
  return response.data;
};
