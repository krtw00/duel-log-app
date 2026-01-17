/**
 * デュエルAPI サービス
 * /duels エンドポイントへのAPI呼び出しを集約
 */

import { api } from './api';
import type { Duel, GameMode } from '../types';

// ポップアップ更新通知用のBroadcastChannel名
export const DUEL_UPDATE_CHANNEL = 'duel-log-updates';

/**
 * デュエル更新をBroadcastChannelで通知
 * ポップアップなど別ウィンドウに即座に反映させる
 */
export const notifyDuelUpdate = (): void => {
  try {
    const channel = new BroadcastChannel(DUEL_UPDATE_CHANNEL);
    channel.postMessage({ type: 'duel-updated', timestamp: Date.now() });
    // 少し待ってからチャネルを閉じる
    setTimeout(() => channel.close(), 100);
  } catch {
    // BroadcastChannel非対応ブラウザは無視
  }
};

/** デュエル一覧取得パラメータ */
export interface GetDuelsParams {
  limit?: number;
  game_mode?: GameMode;
}

/** デュエル作成用データ */
export interface CreateDuelData {
  deck_id: number | null;
  opponent_deck_id: number | null;
  result: number;
  game_mode: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  coin: number;
  first_or_second: number;
  played_date: string;
  notes?: string;
}

/** デュエル更新用データ */
export interface UpdateDuelData {
  deck_id?: number;
  opponent_deck_id?: number;
  is_win?: boolean;
  game_mode?: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  won_coin_toss?: boolean;
  is_going_first?: boolean;
  played_date?: string;
  notes?: string;
}

/** 最新値レスポンス */
export interface LatestValuesResponse {
  latest_rank?: number;
  latest_rate?: number;
  latest_dc?: number;
}

/** CSVインポートレスポンス */
export interface CSVImportResponse {
  created_count: number;
  skipped_count: number;
  errors: string[];
}

/**
 * デュエル一覧を取得
 * @param params
 */
export const getDuels = async (params?: GetDuelsParams): Promise<Duel[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.limit) {
    queryParams.limit = String(params.limit);
  }
  if (params?.game_mode) {
    queryParams.game_mode = params.game_mode;
  }

  const response = await api.get<Duel[]>('/duels/', { params: queryParams });
  return response.data;
};

/**
 * デュエルを作成
 * @param data
 */
export const createDuel = async (data: CreateDuelData): Promise<Duel> => {
  const response = await api.post<Duel>('/duels/', data);
  notifyDuelUpdate();
  return response.data;
};

/**
 * デュエルを更新
 * @param id
 * @param data
 */
export const updateDuel = async (id: number, data: UpdateDuelData): Promise<Duel> => {
  const response = await api.put<Duel>(`/duels/${id}`, data);
  notifyDuelUpdate();
  return response.data;
};

/**
 * デュエルを削除
 * @param id
 */
export const deleteDuel = async (id: number): Promise<void> => {
  await api.delete(`/duels/${id}`);
  notifyDuelUpdate();
};

/**
 * 最新の値（ランク、レート、DC）を取得
 */
export const getLatestValues = async (): Promise<LatestValuesResponse> => {
  const response = await api.get<LatestValuesResponse>('/duels/latest-values/');
  return response.data;
};

/**
 * CSVファイルからデュエルをインポート
 * @param file
 */
export const importDuelsFromCSV = async (file: File): Promise<CSVImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<CSVImportResponse>('/duels/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  notifyDuelUpdate();
  return response.data;
};

/**
 * デュエルをCSVとしてエクスポート
 */
export const exportDuelsToCSV = async (): Promise<Blob> => {
  const response = await api.get('/duels/export/csv', {
    responseType: 'blob',
  });
  return response.data;
};
