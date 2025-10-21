/**
 * 統計計算用 Composable
 * デュエルリストから統計情報を計算する
 */

import { ref, computed, type Ref } from 'vue';
import type { Duel, DuelStats, GameMode } from '../types';

interface UseStatsCalculationProps {
  currentMode: Ref<GameMode>;
  filteredRankDuels: Ref<Duel[]>;
  filteredRateDuels: Ref<Duel[]>;
  filteredEventDuels: Ref<Duel[]>;
  filteredDcDuels: Ref<Duel[]>;
}

export function useStatsCalculation(props: UseStatsCalculationProps) {
  const {
    currentMode,
    filteredRankDuels,
    filteredRateDuels,
    filteredEventDuels,
    filteredDcDuels,
  } = props;

  /**
   * 空の統計オブジェクトを生成
   */
  const emptyStats = (): DuelStats => ({
    total_duels: 0,
    win_count: 0,
    lose_count: 0,
    win_rate: 0,
    first_turn_win_rate: 0,
    second_turn_win_rate: 0,
    coin_win_rate: 0,
    go_first_rate: 0,
  });

  /**
   * 各ゲームモードの統計データ
   */
  const rankStats = ref<DuelStats>(emptyStats());
  const rateStats = ref<DuelStats>(emptyStats());
  const eventStats = ref<DuelStats>(emptyStats());
  const dcStats = ref<DuelStats>(emptyStats());

  /**
   * 現在のゲームモードに対応する統計データを返す
   */
  const currentStats = computed(() => {
    switch (currentMode.value) {
      case 'RANK':
        return rankStats.value;
      case 'RATE':
        return rateStats.value;
      case 'EVENT':
        return eventStats.value;
      case 'DC':
        return dcStats.value;
      default:
        return emptyStats();
    }
  });

  /**
   * デュエルリストから統計を計算
   * @param duelList - デュエルリスト
   * @returns 統計データ
   */
  const calculateStats = (duelList: Duel[]): DuelStats => {
    const total = duelList.length;
    if (total === 0) {
      return emptyStats();
    }

    const wins = duelList.filter((d) => d.result === true).length;
    const coinWins = duelList.filter((d) => d.coin === true).length;
    const firstTurnTotal = duelList.filter((d) => d.first_or_second === true).length;
    const firstTurnWins = duelList.filter(
      (d) => d.result === true && d.first_or_second === true,
    ).length;
    const secondTurnTotal = duelList.filter((d) => d.first_or_second === false).length;
    const secondTurnWins = duelList.filter(
      (d) => d.result === true && d.first_or_second === false,
    ).length;

    return {
      total_duels: total,
      win_count: wins,
      lose_count: total - wins,
      win_rate: wins / total,
      coin_win_rate: coinWins / total,
      go_first_rate: firstTurnTotal / total,
      first_turn_win_rate: firstTurnTotal > 0 ? firstTurnWins / firstTurnTotal : 0,
      second_turn_win_rate: secondTurnTotal > 0 ? secondTurnWins / secondTurnTotal : 0,
    };
  };

  /**
   * 全ゲームモードの統計を再計算
   */
  const recalculateAllStats = () => {
    rankStats.value = calculateStats(filteredRankDuels.value);
    rateStats.value = calculateStats(filteredRateDuels.value);
    eventStats.value = calculateStats(filteredEventDuels.value);
    dcStats.value = calculateStats(filteredDcDuels.value);
  };

  return {
    // State
    rankStats,
    rateStats,
    eventStats,
    dcStats,

    // Computed
    currentStats,

    // Functions
    calculateStats,
    emptyStats,
    recalculateAllStats,
  };
}
