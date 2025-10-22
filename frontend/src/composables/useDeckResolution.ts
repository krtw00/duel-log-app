/**
 * デッキID解決 Composable
 * デッキの新規作成と既存デッキの検索を処理
 */

import { api } from '@/services/api';
import { useNotificationStore } from '@/stores/notification';
import type { Deck } from '@/types';

export function useDeckResolution() {
  const notificationStore = useNotificationStore();

  /**
   * 必要に応じて新しいデッキを作成
   * @param name - デッキ名
   * @param isOpponent - 相手のデッキかどうか
   * @param existingDecks - 既存のデッキリスト
   * @returns デッキID
   */
  const createDeckIfNeeded = async (
    name: string,
    isOpponent: boolean,
    existingDecks: Deck[],
  ): Promise<number | null> => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return null;
      }

      // 既存のデッキを検索
      const existingDeck = existingDecks.find((d) => d.name === trimmedName);
      if (existingDeck) {
        return existingDeck.id;
      }

      // 新しいデッキを作成
      const response = await api.post('/decks/', {
        name: trimmedName,
        is_opponent: isOpponent,
      });

      const newDeck = response.data;
      const deckType = isOpponent ? '相手のデッキ' : '自分のデッキ';
      notificationStore.success(`${deckType}「${trimmedName}」を登録しました`);

      return newDeck.id;
    } catch (error: unknown) {
      // 重複エラーの場合は既存のデッキを検索
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 400) {
        const existingDeck = existingDecks.find((d) => d.name === name.trim());
        if (existingDeck) {
          return existingDeck.id;
        }
      }
      console.error('Failed to create deck:', error);
      throw error;
    }
  };

  /**
   * デッキIDを解決（既存デッキまたは新規作成）
   * @param selected - 選択されたデッキ（オブジェクトまたは文字列）
   * @param isOpponent - 相手のデッキかどうか
   * @param existingDecks - 既存のデッキリスト
   * @returns デッキID
   */
  const resolveDeckId = async (
    selected: Deck | string | null,
    isOpponent: boolean,
    existingDecks: Deck[],
  ): Promise<number | null> => {
    if (!selected) {
      return null;
    }

    // オブジェクトの場合（既存のデッキを選択）
    if (typeof selected === 'object' && selected.id) {
      return selected.id;
    }

    // 文字列の場合（新しいデッキ名を入力）
    if (typeof selected === 'string' && selected.trim()) {
      return await createDeckIfNeeded(selected, isOpponent, existingDecks);
    }

    return null;
  };

  return {
    createDeckIfNeeded,
    resolveDeckId,
  };
}
