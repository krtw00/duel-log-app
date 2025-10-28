/**
 * 統計計算用 Composable
 *
 * @description
 * デュエルリストから統計情報（勝率、ターン順勝率、コイントス勝率など）を計算します。
 * 各ゲームモード（RANK、RATE、EVENT、DC）ごとに独立した統計データを管理し、
 * 現在選択されているモードに対応する統計を提供します。
 *
 * @remarks
 * このComposableはDashboardViewで使用され、フィルタリングされた対戦記録から
 * リアルタイムで統計を計算します。統計計算はクライアントサイドで行われるため、
 * サーバーへのリクエストなしで即座に結果を表示できます。
 *
 * @example
 * ```typescript
 * import { ref } from 'vue';
 * import { useStatsCalculation } from '@/composables/useStatsCalculation';
 *
 * const currentMode = ref<GameMode>('RANK');
 * const filteredRankDuels = ref<Duel[]>([...]);
 * const filteredRateDuels = ref<Duel[]>([...]);
 * const filteredEventDuels = ref<Duel[]>([...]);
 * const filteredDcDuels = ref<Duel[]>([...]);
 *
 * const {
 *   currentStats,
 *   recalculateAllStats
 * } = useStatsCalculation({
 *   currentMode,
 *   filteredRankDuels,
 *   filteredRateDuels,
 *   filteredEventDuels,
 *   filteredDcDuels
 * });
 *
 * // 統計を再計算
 * recalculateAllStats();
 *
 * // 現在のモードの勝率を表示
 * console.log(`勝率: ${(currentStats.value.win_rate * 100).toFixed(1)}%`);
 * ```
 */

import { ref, computed, type Ref } from 'vue';
import type { Duel, DuelStats, GameMode } from '../types';

/**
 * useStatsCalculation の入力プロパティ
 *
 * @property {Ref<GameMode>} currentMode - 現在選択されているゲームモード
 * @property {Ref<Duel[]>} filteredRankDuels - RANKモードでフィルタリングされた対戦記録
 * @property {Ref<Duel[]>} filteredRateDuels - RATEモードでフィルタリングされた対戦記録
 * @property {Ref<Duel[]>} filteredEventDuels - EVENTモードでフィルタリングされた対戦記録
 * @property {Ref<Duel[]>} filteredDcDuels - DCモードでフィルタリングされた対戦記録
 */
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
   *
   * @returns {DuelStats} 全ての値が0に初期化された統計オブジェクト
   *
   * @remarks
   * 対戦記録がない場合や、初期化時に使用されます。
   * 0除算を防ぐため、全ての勝率フィールドも0で初期化されます。
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
   *
   * @remarks
   * 各モードごとに独立した統計を保持することで、モード切り替え時に
   * 再計算不要で即座に表示を切り替えることができます。
   */
  const rankStats = ref<DuelStats>(emptyStats());
  const rateStats = ref<DuelStats>(emptyStats());
  const eventStats = ref<DuelStats>(emptyStats());
  const dcStats = ref<DuelStats>(emptyStats());

  /**
   * 現在のゲームモードに対応する統計データを返す
   *
   * @returns {DuelStats} 現在選択されているモードの統計データ
   *
   * @remarks
   * これはcomputed値であり、currentModeが変更されると自動的に更新されます。
   * 不明なモードの場合は空の統計を返します（デフォルト値として機能）。
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
   *
   * @param {Duel[]} duelList - 統計計算対象の対戦記録リスト
   * @returns {DuelStats} 計算された統計データ
   *
   * @remarks
   * 以下の統計項目を計算します：
   * - total_duels: 総対戦数
   * - win_count: 勝利数
   * - lose_count: 敗北数
   * - win_rate: 総合勝率（0-1の範囲）
   * - coin_win_rate: コイントス勝率（0-1の範囲）
   * - go_first_rate: 先攻になった確率（0-1の範囲）
   * - first_turn_win_rate: 先攻時の勝率（0-1の範囲）
   * - second_turn_win_rate: 後攻時の勝率（0-1の範囲）
   *
   * 対戦数が0の場合は空の統計（全て0）を返します。
   * 先攻/後攻の対戦数が0の場合、対応する勝率は0になります。
   *
   * @example
   * ```typescript
   * const duels: Duel[] = [
   *   { isWin: true, wonCoinToss: true, isGoingFirst: true, ... },
   *   { isWin: false, wonCoinToss: false, isGoingFirst: false, ... }
   * ];
   * const stats = calculateStats(duels);
   * console.log(stats.win_rate); // 0.5 (50%)
   * ```
   */
  const calculateStats = (duelList: Duel[]): DuelStats => {
    const total = duelList.length;
    if (total === 0) {
      return emptyStats();
    }

    const wins = duelList.filter((d) => d.isWin === true).length;
    const coinWins = duelList.filter((d) => d.wonCoinToss === true).length;
    const firstTurnTotal = duelList.filter((d) => d.isGoingFirst === true).length;
    const firstTurnWins = duelList.filter(
      (d) => d.isWin === true && d.isGoingFirst === true,
    ).length;
    const secondTurnTotal = duelList.filter((d) => d.isGoingFirst === false).length;
    const secondTurnWins = duelList.filter(
      (d) => d.isWin === true && d.isGoingFirst === false,
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
   *
   * @remarks
   * フィルタリング条件が変更されたとき（期間、デッキなど）や、
   * 新しい対戦記録が追加/削除/更新されたときに呼び出します。
   *
   * 4つ全てのゲームモードの統計を一括で再計算するため、
   * 頻繁に呼び出すとパフォーマンスに影響する可能性があります。
   *
   * @example
   * ```typescript
   * // フィルタ変更時に統計を更新
   * watch([selectedMonth, selectedDeck], () => {
   *   recalculateAllStats();
   * });
   * ```
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
