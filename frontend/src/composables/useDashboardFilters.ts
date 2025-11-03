/**
 * ダッシュボードフィルター用 Composable
 * 期間フィルター、デッキフィルターの管理
 */

import { ref, computed, type Ref } from 'vue';
import type { Duel, Deck, GameMode } from '../types';

interface UseDashboardFiltersProps {
  currentMode: Ref<GameMode>;
  rankDuels: Ref<Duel[]>;
  rateDuels: Ref<Duel[]>;
  eventDuels: Ref<Duel[]>;
  dcDuels: Ref<Duel[]>;
  decks: Ref<Deck[]>;
}

type DeckOption = { id: number; name: string };

export function useDashboardFilters(props: UseDashboardFiltersProps) {
  const { currentMode, rankDuels, rateDuels, eventDuels, dcDuels, decks } = props;

  // フィルター状態
  const filterPeriodType = ref<'all' | 'range'>('all');
  const filterRangeStart = ref(1);
  const filterRangeEnd = ref(30);
  const filterMyDeckId = ref<number | null>(null);

  // フィルターオプション
  const filterPeriodOptions = [
    { title: '全体', value: 'all' },
    { title: '直近N戦', value: 'range' },
  ];

  // ゲームモード別の利用可能なデッキ
  const availableDecksByMode = ref<Record<GameMode, DeckOption[]>>({
    RANK: [],
    RATE: [],
    EVENT: [],
    DC: [],
  });

  // 現在のモードで利用可能なデッキ
  const availableMyDecks = computed(() => availableDecksByMode.value[currentMode.value] || []);

  /**
   * 範囲フィルターのみを適用
   * @param duelList - デュエルリスト
   * @returns フィルタリングされたデュエルリスト
   */
  const getRangeFilteredDuels = (duelList: Duel[]): Duel[] => {
    const sorted = [...duelList].sort(
      (a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime(),
    );

    if (filterPeriodType.value === 'range') {
      const start = Math.max(0, (filterRangeStart.value || 1) - 1);
      const end = filterRangeEnd.value || sorted.length;
      return sorted.slice(start, end);
    }

    return sorted;
  };

  /**
   * 統計用にフィルタリングされたデュエル（期間＋デッキ）
   * @param duelList - デュエルリスト
   * @returns フィルタリングされたデュエルリスト
   */
  const applyStatFilters = (duelList: Duel[]): Duel[] => {
    const ranged = getRangeFilteredDuels(duelList);
    if (filterMyDeckId.value !== null) {
      return ranged.filter((duel) => duel.deck_id === filterMyDeckId.value);
    }
    return ranged;
  };

  // フィルタリングされたデュエル
  const filteredRankDuels = computed(() => applyStatFilters(rankDuels.value));
  const filteredRateDuels = computed(() => applyStatFilters(rateDuels.value));
  const filteredEventDuels = computed(() => applyStatFilters(eventDuels.value));
  const filteredDcDuels = computed(() => applyStatFilters(dcDuels.value));

  /**
   * 利用可能なデッキを更新
   */
  const updateAvailableDecks = () => {
    const modeMap: Record<GameMode, Duel[]> = {
      RANK: rankDuels.value,
      RATE: rateDuels.value,
      EVENT: eventDuels.value,
      DC: dcDuels.value,
    };

    const updated: Record<GameMode, DeckOption[]> = {
      RANK: [],
      RATE: [],
      EVENT: [],
      DC: [],
    };

    (Object.keys(modeMap) as GameMode[]).forEach((mode) => {
      const rangeFiltered = getRangeFilteredDuels(modeMap[mode]);
      const deckMap = new Map<number, DeckOption>();
      rangeFiltered.forEach((duel) => {
        if (duel.deck_id) {
          // Try to get deck name from embedded deck object or from decks array
          const deckName = duel.deck?.name || decks.value.find((d) => d.id === duel.deck_id)?.name;
          if (deckName) {
            deckMap.set(duel.deck_id, { id: duel.deck_id, name: deckName });
          }
        }
      });
      updated[mode] = Array.from(deckMap.values());
    });

    availableDecksByMode.value = updated;

    // 現在選択中のデッキが存在しない場合はクリア
    const currentModeDecks = updated[currentMode.value] || [];
    if (
      filterMyDeckId.value !== null &&
      !currentModeDecks.some((deck) => deck.id === filterMyDeckId.value)
    ) {
      filterMyDeckId.value = null;
    }
  };

  /**
   * フィルターをリセット
   */
  const resetFilters = () => {
    filterPeriodType.value = 'all';
    filterRangeStart.value = 1;
    filterRangeEnd.value = 30;
    filterMyDeckId.value = null;
  };

  return {
    // State
    filterPeriodType,
    filterRangeStart,
    filterRangeEnd,
    filterMyDeckId,
    availableDecksByMode,

    // Computed
    availableMyDecks,
    filteredRankDuels,
    filteredRateDuels,
    filteredEventDuels,
    filteredDcDuels,

    // Constants
    filterPeriodOptions,

    // Functions
    getRangeFilteredDuels,
    applyStatFilters,
    updateAvailableDecks,
    resetFilters,
  };
}
