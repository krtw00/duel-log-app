/**
 * 最新の対戦値管理 Composable
 * ゲームモード別の最新値（ランク、レート、DC、デッキ）を取得・適用
 */

import { ref } from 'vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { createLogger } from '@/utils/logger';
import type { Deck, GameMode } from '@/types';

const logger = createLogger('LatestDuelValues');

// localStorageのキー
const LAST_MY_DECK_ID_KEY = 'duel-log-app:lastMyDeckId';
// const LAST_OPPONENT_DECK_ID_KEY = 'duel-log-app:lastOpponentDeckId'; // 相手デッキは保存しない
const LAST_RANK_KEY = 'duel-log-app:lastRank';

interface LatestValue {
  value: number;
  deck_id: number;
  opponent_deck_id: number;
}

interface LatestValues {
  [key: string]: LatestValue;
}

// デフォルト値
const DEFAULT_RANK = 18; // プラチナ5
const DEFAULT_RATE = 1500;
const DEFAULT_DC = 0;

export function useLatestDuelValues() {
  const latestValues = ref<LatestValues>({});
  const authStore = useAuthStore();

  const buildStorageKey = (base: string, userId: string | null) => {
    return userId ? `${base}:${userId}` : base;
  };

  const getStorageItem = (base: string) => {
    const userId = authStore.user?.id ?? null;
    const scopedKey = buildStorageKey(base, userId);
    return localStorage.getItem(scopedKey) ?? localStorage.getItem(base);
  };

  const setStorageItem = (base: string, value: string) => {
    const userId = authStore.user?.id ?? null;
    const scopedKey = buildStorageKey(base, userId);
    localStorage.setItem(scopedKey, value);
    if (userId) {
      // backward compat: remove old unscoped keys to avoid cross-user leakage
      localStorage.removeItem(base);
    }
  };

  /**
   * 最新値をAPIから取得
   */
  const fetchLatestValues = async () => {
    try {
      const response = await api.get('/duels/latest-values/');
      latestValues.value = response.data;
    } catch (error) {
      logger.error('Failed to fetch latest values');
      latestValues.value = {};
    }
  };

  /**
   * ゲームモードに応じた最新値をフォームに適用
   * @param gameMode - ゲームモード
   * @param myDecks - 自分のデッキリスト
   * @param opponentDecks - 相手のデッキリスト
   * @returns 適用された値のオブジェクト
   */
  const applyLatestValuesToGameMode = (
    gameMode: GameMode,
    myDecks: Deck[],
    _opponentDecks: Deck[],
  ): {
    rank?: number;
    rate_value?: number;
    dc_value?: number;
    selectedMyDeck: Deck | null;
    selectedOpponentDeck: Deck | null;
  } => {
    const latestFromDb = latestValues.value[gameMode];

    // localStorageから値を取得
    const lastMyDeckId = getStorageItem(LAST_MY_DECK_ID_KEY);
    // const lastOpponentDeckId = getStorageItem(LAST_OPPONENT_DECK_ID_KEY);
    const lastRank = getStorageItem(LAST_RANK_KEY);

    const result: {
      rank?: number;
      rate_value?: number;
      dc_value?: number;
      selectedMyDeck: Deck | null;
      selectedOpponentDeck: Deck | null;
    } = {
      selectedMyDeck: null,
      selectedOpponentDeck: null,
    };

    // 値の適用ロジック (DB > localStorage > デフォルト)
    // 1. RANK/RATE/DC値
    if (gameMode === 'RANK') {
      if (latestFromDb) {
        result.rank = latestFromDb.value;
      } else if (lastRank) {
        result.rank = Number(lastRank);
      } else {
        result.rank = DEFAULT_RANK;
      }
    } else if (gameMode === 'RATE') {
      if (latestFromDb) {
        result.rate_value = latestFromDb.value;
      } else {
        result.rate_value = DEFAULT_RATE;
      }
    } else if (gameMode === 'DC') {
      if (latestFromDb) {
        result.dc_value = latestFromDb.value;
      } else {
        result.dc_value = DEFAULT_DC;
      }
    }

    // 2. 使用デッキ
    const myDeckIdToFind = latestFromDb?.deck_id ?? (lastMyDeckId ? Number(lastMyDeckId) : null);
    if (myDeckIdToFind) {
      result.selectedMyDeck = myDecks.find((d) => d.id === myDeckIdToFind) || null;
    }

    // 3. 相手デッキ（登録後は空欄にするため、自動設定しない）
    // const opponentDeckIdToFind =
    //   latestFromDb?.opponent_deck_id ?? (lastOpponentDeckId ? Number(lastOpponentDeckId) : null);
    // if (opponentDeckIdToFind) {
    //   result.selectedOpponentDeck =
    //     opponentDecks.find((d) => d.id === opponentDeckIdToFind) || null;
    // }

    return result;
  };

  /**
   * 最後に使用した値をlocalStorageに保存する
   * @param data - 保存するデータ
   */
  const saveLastUsedValues = (data: {
    myDeckId: number;
    opponentDeckId: number;
    rank?: number;
    gameMode: GameMode;
  }) => {
    setStorageItem(LAST_MY_DECK_ID_KEY, String(data.myDeckId));
    // 相手デッキは登録後に空欄にするため、localStorageに保存しない
    // setStorageItem(LAST_OPPONENT_DECK_ID_KEY, String(data.opponentDeckId));
    if (data.gameMode === 'RANK' && data.rank !== undefined) {
      setStorageItem(LAST_RANK_KEY, String(data.rank));
    }
  };

  return {
    latestValues,
    fetchLatestValues,
    applyLatestValuesToGameMode,
    saveLastUsedValues,
    DEFAULT_RANK,
    DEFAULT_RATE,
    DEFAULT_DC,
  };
}
