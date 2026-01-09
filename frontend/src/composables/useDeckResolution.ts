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
   * @returns デッキ
   */
  const createDeckIfNeeded = async (
    name: string,
    isOpponent: boolean,
    existingDecks: Deck[],
  ): Promise<Deck | null> => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return null;
      }

      // 既存のデッキを検索
      const existingDeck = existingDecks.find((d) => d.name === trimmedName);
      if (existingDeck) {
        return existingDeck;
      }

      // 新しいデッキを作成
      const response = await api.post('/decks/', {
        name: trimmedName,
        is_opponent: isOpponent,
      });

      const newDeck = response.data;
      const deckType = isOpponent ? '相手のデッキ' : '自分のデッキ';
      notificationStore.success(`${deckType}「${trimmedName}」を登録しました`);

      return newDeck;
    } catch (error: unknown) {
      // 重複エラーの場合は既存のデッキを検索
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 400) {
        const trimmedName = name.trim();
        const existingDeck = existingDecks.find((d) => d.name === trimmedName);
        if (existingDeck) return existingDeck;
        try {
          const response = await api.get('/decks/', {
            params: {
              is_opponent: isOpponent,
              active_only: false,
            },
          });
          const decks: Deck[] = response.data;
          const matched = decks.find((deck) => deck.name === trimmedName);
          if (matched) return matched;
        } catch (fetchError) {
          console.error('Failed to fetch decks after duplicate error:', fetchError);
        }
      }
      console.error('Failed to create deck:', error);
      throw error;
    }
  };

  /**
   * デッキを解決（既存デッキまたは新規作成）
   * @param selected - 選択されたデッキ（オブジェクト・ID・文字列）
   * @param isOpponent - 相手のデッキかどうか
   * @param existingDecks - 既存のデッキリスト
   * @returns デッキ
   */
  const resolveDeckId = async (
    selected: Deck | string | null,
    isOpponent: boolean,
    existingDecks: Deck[],
  ): Promise<Deck | null> => {
    if (!selected) {
      return null;
    }

    // オブジェクトの場合（既存のデッキを選択）
    if (typeof selected === 'object' && selected.id) {
      return selected;
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
