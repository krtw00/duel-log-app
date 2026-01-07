/**
 * 最新の対戦値管理 Composable
 * ゲームモード別の最新値（ランク、レート、DC、デッキ）を取得・適用
 */

import { ref } from 'vue';
import { api } from '@/services/api';
import type { Deck, GameMode } from '@/types';

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

  /**
   * 最新値をAPIから取得
   */
  const fetchLatestValues = async () => {
    try {
      const response = await api.get('/duels/latest-values/');
      latestValues.value = response.data;
    } catch (error) {
      console.error('Failed to fetch latest values:', error);
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
    opponentDecks: Deck[],
  ): {
    rank?: number;
    rate_value?: number;
    dc_value?: number;
    selectedMyDeck: Deck | null;
    selectedOpponentDeck: Deck | null;
  } => {
    const latest = latestValues.value[gameMode];

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

    if (latest) {
      // 最新値が存在する場合
      if (gameMode === 'RANK') {
        result.rank = latest.value ?? DEFAULT_RANK;
      } else if (gameMode === 'RATE') {
        result.rate_value = latest.value ?? DEFAULT_RATE;
      } else if (gameMode === 'DC') {
        result.dc_value = latest.value ?? DEFAULT_DC;
      }
      result.selectedMyDeck = myDecks.find((d) => d.id === latest.deck_id) || null;
      result.selectedOpponentDeck =
        opponentDecks.find((d) => d.id === latest.opponent_deck_id) || null;
    } else {
      // 最新値がない場合はデフォルト値を使用
      if (gameMode === 'RANK') {
        result.rank = DEFAULT_RANK;
      } else if (gameMode === 'RATE') {
        result.rate_value = DEFAULT_RATE;
      } else if (gameMode === 'DC') {
        result.dc_value = DEFAULT_DC;
      }
    }

    return result;
  };

  return {
    latestValues,
    fetchLatestValues,
    applyLatestValuesToGameMode,
    DEFAULT_RANK,
    DEFAULT_RATE,
    DEFAULT_DC,
  };
}
