/**
 * デッキAPI サービス
 * /decks エンドポイントへのAPI呼び出しを集約
 */

import { api } from './api';
import type { Deck, DeckCreate, DeckUpdate } from '../types';

/** デッキ一覧取得パラメータ */
export interface GetDecksParams {
  is_opponent?: boolean;
  active?: boolean;
  game_mode?: string;
}

/**
 * デッキ一覧を取得
 */
export const getDecks = async (params?: GetDecksParams): Promise<Deck[]> => {
  const queryParams = new URLSearchParams();

  if (params?.is_opponent !== undefined) {
    queryParams.append('is_opponent', String(params.is_opponent));
  }
  if (params?.active !== undefined) {
    queryParams.append('active', String(params.active));
  }
  if (params?.game_mode) {
    queryParams.append('game_mode', params.game_mode);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/decks/?${queryString}` : '/decks/';

  const response = await api.get<Deck[]>(url);
  return response.data;
};

/**
 * 自分のデッキ一覧を取得
 */
export const getMyDecks = async (gameMode?: string): Promise<Deck[]> => {
  return getDecks({ is_opponent: false, game_mode: gameMode });
};

/**
 * 相手デッキ一覧を取得
 */
export const getOpponentDecks = async (gameMode?: string): Promise<Deck[]> => {
  return getDecks({ is_opponent: true, game_mode: gameMode });
};

/**
 * デッキを作成
 */
export const createDeck = async (data: DeckCreate): Promise<Deck> => {
  const response = await api.post<Deck>('/decks/', data);
  return response.data;
};

/**
 * デッキを更新
 */
export const updateDeck = async (id: number, data: DeckUpdate): Promise<Deck> => {
  const response = await api.put<Deck>(`/decks/${id}`, data);
  return response.data;
};

/**
 * デッキを削除
 */
export const deleteDeck = async (id: number): Promise<void> => {
  await api.delete(`/decks/${id}`);
};

/**
 * 使用されていないデッキを全てアーカイブ
 */
export const archiveAllUnusedDecks = async (): Promise<{ archived_count: number }> => {
  const response = await api.post<{ archived_count: number }>('/decks/archive-all');
  return response.data;
};
