<template>
  <app-layout current-view="statistics">
    <v-container fluid class="pa-4 pa-sm-6">
      <h1 class="statistics-title text-h4 mb-6">{{ LL?.statistics.title() }}</h1>

      <!-- 年月選択 -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <v-select
            v-model="selectedYear"
            :items="years"
            :label="LL?.common.year()"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="debouncedRefreshStatistics"
          ></v-select>
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="selectedMonth"
            :items="months"
            :label="LL?.common.month()"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="debouncedRefreshStatistics"
          ></v-select>
        </v-col>
      </v-row>

      <!-- 統計フィルター -->
      <statistics-filter
        v-model:period-type="filterPeriodType"
        v-model:range-start="filterRangeStart"
        v-model:range-end="filterRangeEnd"
        v-model:my-deck-id="filterMyDeckId"
        :available-my-decks="availableMyDecks"
        @update:period-type="debouncedRefreshStatistics"
        @update:range-start="debouncedRefreshStatistics"
        @update:range-end="debouncedRefreshStatistics"
        @update:my-deck-id="debouncedHandleMyDeckFilterChange"
        @reset="resetFilters"
      />

      <!-- ゲームモード切り替えタブ -->
      <v-card class="mode-tab-card mb-4">
        <v-tabs v-model="currentTab" color="primary" align-tabs="center" height="64">
          <v-tab value="RANK" class="custom-tab">
            <v-icon start>mdi-crown</v-icon>
            {{ LL?.duels.gameMode.rank() }}
          </v-tab>
          <v-tab value="RATE" class="custom-tab">
            <v-icon start>mdi-chart-line</v-icon>
            {{ LL?.duels.gameMode.rate() }}
          </v-tab>
          <v-tab value="EVENT" class="custom-tab">
            <v-icon start>mdi-calendar-star</v-icon>
            {{ LL?.duels.gameMode.event() }}
          </v-tab>
          <v-tab value="DC" class="custom-tab">
            <v-icon start>mdi-trophy-variant</v-icon>
            {{ LL?.duels.gameMode.dc() }}
          </v-tab>
        </v-tabs>
      </v-card>

      <v-window v-model="currentTab">
        <v-window-item v-for="mode in gameModes" :key="mode" :value="mode">
          <statistics-content
            :statistics="{
              monthlyDistribution: statisticsByMode[mode].monthlyDistribution,
              duels: monthlyDuelsByMode[mode],
              myDeckWinRates: statisticsByMode[mode].myDeckWinRates,
              matchupData: statisticsByMode[mode].matchupData,
              valueSequence: statisticsByMode[mode].valueSequence,
            }"
            :game-mode="mode"
            :display-month="currentMonth"
            :loading="loading"
          />
        </v-window-item>
      </v-window>
    </v-container>
  </app-layout>
</template>

<script setup lang="ts">
/**
 * StatisticsView.vue
 *
 * 統計情報を表示するメインビューコンポーネント
 *
 * 機能:
 * - ゲームモード別（RANK/RATE/EVENT/DC）の統計表示
 * - 年月による期間フィルタリング
 * - デッキペアによるフィルタリング（自分のデッキ vs 相手のデッキ）
 * - 範囲指定フィルタリング（例: 1-50戦目の統計）
 * - 月ごとの相手デッキ分布（円グラフ）
 * - デッキ相性表（先攻/後攻別の勝率）
 * - レート/DC値の推移グラフ
 *
 * 主要な状態:
 * - selectedYear/selectedMonth: 年月フィルター
 * - filterPeriodType: 期間タイプ（'all' = 全期間, 'range' = 範囲指定）
 * - filterMyDeckId: プレイヤーデッキでフィルタリング（null = 全デッキ）
 * - filterOpponentDeckId: 相手デッキでフィルタリング（null = 全デッキ）
 * - filterRangeStart/End: 範囲指定の開始/終了（1始まり）
 * - statisticsByMode: ゲームモード別の統計データ（RANK/RATE/EVENT/DC）
 *
 * データフロー:
 * 1. マウント時 → fetchStatistics() で全モードの統計を取得
 * 2. フィルター変更 → refreshStatisticsWithDecks() で再取得
 * 3. APIレスポンス → 各モードの統計データを構築してビューに反映
 */
import { ref, onMounted, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { api } from '@/services/api';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Statistics');
import AppLayout from '@/components/layout/AppLayout.vue';
import { useThemeStore } from '@/stores/theme';
import { useUiStore } from '@/stores/ui';
import { useChartOptions } from '@/composables/useChartOptions';
import StatisticsContent from '@/components/statistics/StatisticsContent.vue';
import StatisticsFilter from '@/components/statistics/StatisticsFilter.vue';
import { useLocale } from '@/composables/useLocale';

const { LL, currentLocale } = useLocale();

const themeStore = useThemeStore();
const uiStore = useUiStore();
const { basePieChartOptions, baseLineChartOptions } = useChartOptions();

const determineNiceStep = (count: number) => {
  // キリの良い間隔を決定（10, 20, 50, 100, 200, 500...）
  if (count <= 10) return 1;
  if (count <= 30) return 5;
  if (count <= 60) return 10;
  if (count <= 120) return 20;
  if (count <= 300) return 50;
  if (count <= 600) return 100;
  return 200;
};

const createLabelFormatter = (total: number) => {
  const step = determineNiceStep(total);
  return (value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return value;
    }
    // 最初（1）と最後は必ず表示
    if (numeric === 1 || numeric === total) {
      return value;
    }
    // キリの良い値（stepの倍数）のみ表示
    if (numeric % step === 0) {
      return value;
    }
    return '';
  };
};

const createPiePercentFormatter = (series: number[]) => {
  return (value: number) => {
    const total = series.reduce((sum, v) => sum + (Number(v) || 0), 0);
    const numericValue = Number(value) || 0;
    if (total <= 0) return '0.0%';
    const percent = (numericValue / total) * 100;
    return `${percent.toFixed(1)}%`;
  };
};

// --- Types ---
import type { ApexPieChartOptions, ApexLineChartOptions } from '@/types/chart';
import type { MatchupData, GameMode, Duel, Deck } from '@/types';
import type { StatisticsQueryParams } from '@/types/statistics';

interface DistributionData {
  series: number[];
  chartOptions: ApexPieChartOptions;
}

interface ValueSequenceChartData {
  series: { name: string; data: number[] }[];
  chartOptions: ApexLineChartOptions;
}

interface MyDeckWinRate {
  deck_name: string;
  total_duels: number;
  wins: number;
  losses: number;
  win_rate: number;
}

interface ValueSequenceEntry {
  value: number;
}

type ExtendedDuel = Duel & { no: number };

interface StatisticsModeData {
  monthlyDistribution: DistributionData;
  matchupData: MatchupData[];
  myDeckWinRates: MyDeckWinRate[];
  valueSequence: ValueSequenceChartData;
}

interface AllStatisticsData {
  [key: string]: StatisticsModeData;
}

const loading = ref(true);
const currentTab = ref<GameMode>(uiStore.lastGameMode);
const gameModes: GameMode[] = ['RANK', 'RATE', 'EVENT', 'DC'];

// --- Date Selection ---
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const currentMonth = computed(() => {
  if (currentLocale.value === 'ja') {
    return `${selectedYear.value}年${selectedMonth.value}月`;
  } else if (currentLocale.value === 'ko') {
    return `${selectedYear.value}년 ${selectedMonth.value}월`;
  } else {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[selectedMonth.value - 1]} ${selectedYear.value}`;
  }
});

// --- Filter Settings ---
const filterPeriodType = ref<'all' | 'range'>('all');
const filterRangeStart = ref(1);
const filterRangeEnd = ref(30);
const filterMyDeckId = ref<number | null>(null);
const filterOpponentDeckId = ref<number | null>(null);

const availableMyDecks = ref<{ id: number; name: string }[]>([]);
const availableOpponentDecks = ref<{ id: number; name: string }[]>([]);

// --- Cache for request parameters ---
const lastFetchParams = ref<{
  year: number;
  month: number;
  periodType: 'all' | 'range';
  rangeStart: number;
  rangeEnd: number;
  myDeckId: number | null;
  opponentDeckId: number | null;
  gameMode: GameMode;
} | null>(null);

const resetFilters = () => {
  filterPeriodType.value = 'all';
  filterRangeStart.value = 1;
  filterRangeEnd.value = 30;
  filterMyDeckId.value = null;
  filterOpponentDeckId.value = null;
  // Reset immediately without debounce
  lastFetchParams.value = null;
  refreshStatisticsWithDecks();
};

// --- Chart Base Options ---
// baseChartOptions と lineChartBaseOptions は useChartOptions から取得
// basePieChartOptions と baseLineChartOptions として利用可能

// --- Statistics Data ---
const createInitialStats = (): AllStatisticsData => {
  const modes = ['RANK', 'RATE', 'EVENT', 'DC'];
  const stats: AllStatisticsData = {};
  modes.forEach((mode) => {
    stats[mode] = {
      monthlyDistribution: {
        series: [],
        chartOptions: { ...basePieChartOptions.value, labels: [] },
      },
      matchupData: [],
      myDeckWinRates: [],
      valueSequence: {
        series: [{ name: mode, data: [] }],
        chartOptions: {
          ...baseLineChartOptions.value,
          xaxis: { ...baseLineChartOptions.value.xaxis, categories: [] },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        },
      },
    };
  });
  return stats;
};

const statisticsByMode = ref<AllStatisticsData>(createInitialStats());
const monthlyDuelsByMode = ref<Record<GameMode, ExtendedDuel[]>>({
  RANK: [],
  RATE: [],
  EVENT: [],
  DC: [],
});

const fetchAvailableDecks = async () => {
  try {
    const params: StatisticsQueryParams = {
      year: selectedYear.value,
      month: selectedMonth.value,
      game_mode: currentTab.value as GameMode,
    };

    if (filterPeriodType.value === 'range') {
      params.range_start = filterRangeStart.value;
      params.range_end = filterRangeEnd.value;
    }

    const response = await api.get('/statistics/available-decks', { params });
    availableMyDecks.value = response.data.my_decks || [];
    availableOpponentDecks.value = response.data.opponent_decks || [];

    if (filterMyDeckId.value !== null) {
      const exists = availableMyDecks.value.some((deck) => deck.id === filterMyDeckId.value);
      if (!exists) {
        filterMyDeckId.value = null;
      }
    }
    if (filterOpponentDeckId.value !== null) {
      const exists = availableOpponentDecks.value.some(
        (deck) => deck.id === filterOpponentDeckId.value,
      );
      if (!exists) {
        filterOpponentDeckId.value = null;
      }
    }
  } catch (error) {
    logger.error('Failed to fetch available decks');
  }
};

const refreshStatisticsWithDecks = async () => {
  // Check if parameters have changed
  const currentParams = {
    year: selectedYear.value,
    month: selectedMonth.value,
    periodType: filterPeriodType.value,
    rangeStart: filterRangeStart.value,
    rangeEnd: filterRangeEnd.value,
    myDeckId: filterMyDeckId.value,
    opponentDeckId: filterOpponentDeckId.value,
    gameMode: currentTab.value as GameMode,
  };

  // Skip if parameters haven't changed
  if (lastFetchParams.value && JSON.stringify(lastFetchParams.value) === JSON.stringify(currentParams)) {
    logger.debug('Skipping fetch: parameters unchanged');
    return;
  }

  // Update cache
  lastFetchParams.value = currentParams;

  // First, fetch available decks (other calls depend on this)
  await fetchAvailableDecks();

  // Then execute statistics and duels in parallel
  await Promise.all([
    fetchStatistics(),
    fetchMonthlyDuels(currentTab.value as GameMode),
  ]);
};

const handleMyDeckFilterChange = async () => {
  // Update cache to force refresh
  lastFetchParams.value = {
    year: selectedYear.value,
    month: selectedMonth.value,
    periodType: filterPeriodType.value,
    rangeStart: filterRangeStart.value,
    rangeEnd: filterRangeEnd.value,
    myDeckId: filterMyDeckId.value,
    opponentDeckId: filterOpponentDeckId.value,
    gameMode: currentTab.value as GameMode,
  };

  // Parallel execution of API calls
  await Promise.all([
    fetchStatistics(),
    fetchMonthlyDuels(currentTab.value as GameMode),
  ]);
};

// Debounced version of refreshStatisticsWithDecks (400ms delay)
const debouncedRefreshStatistics = useDebounceFn(refreshStatisticsWithDecks, 400);

// Debounced version of handleMyDeckFilterChange (400ms delay)
const debouncedHandleMyDeckFilterChange = useDebounceFn(handleMyDeckFilterChange, 400);

const resolveDeckName = (deckId: number): string => {
  const deck = availableMyDecks.value.find((d) => d.id === deckId);
  return deck ? deck.name : LL.value?.common.noData() || '';
};

const resolveOpponentDeckName = (deckId: number): string => {
  const deck = availableOpponentDecks.value.find((d) => d.id === deckId);
  return deck ? deck.name : LL.value?.common.noData() || '';
};

const buildDeckStub = (id: number, name: string, isOpponent: boolean, userId: string): Deck => ({
  id,
  name,
  is_opponent: isOpponent,
  active: true,
  user_id: userId,
});

const fetchMonthlyDuels = async (mode: GameMode) => {
  try {
    monthlyDuelsByMode.value[mode] = [];
    const params: Record<string, any> = {
      year: selectedYear.value,
      month: selectedMonth.value,
      game_mode: mode,
    };

    if (filterPeriodType.value === 'range') {
      params.range_start = filterRangeStart.value;
      if (filterRangeEnd.value) {
        params.range_end = filterRangeEnd.value;
      }
    }

    if (filterMyDeckId.value !== null) {
      params.deck_id = filterMyDeckId.value;
    }
    if (filterOpponentDeckId.value !== null) {
      params.opponent_deck_id = filterOpponentDeckId.value;
    }

    const response = await api.get('/duels/', { params });
    const duels: Duel[] = response.data;
    const offset = filterPeriodType.value === 'range' ? Math.max(0, filterRangeStart.value - 1) : 0;
    const total = duels.length + offset;

    monthlyDuelsByMode.value[mode] = duels.map((duel, index) => {
      const deckName = resolveDeckName(duel.deck_id);
      const opponentName = resolveOpponentDeckName(duel.opponent_deck_id);

      return {
        ...duel,
        deck: buildDeckStub(duel.deck_id, deckName, false, duel.user_id),
        opponentDeck: buildDeckStub(duel.opponent_deck_id, opponentName, true, duel.user_id),
        no: total - index,
      };
    });
  } catch (error) {
    logger.error('Failed to fetch monthly duels');
    monthlyDuelsByMode.value[mode] = [];
  }
};

const fetchStatistics = async () => {
  loading.value = true;
  try {
    // 統計情報のパラメータ
    const params: StatisticsQueryParams = {
      year: selectedYear.value,
      month: selectedMonth.value,
    };

    // フィルターパラメータを追加
    if (filterPeriodType.value === 'range') {
      params.range_start = filterRangeStart.value;
      params.range_end = filterRangeEnd.value;
    }

    // デッキフィルターを追加
    if (filterMyDeckId.value !== null) {
      params.my_deck_id = filterMyDeckId.value;
    }
    if (filterOpponentDeckId.value !== null) {
      params.opponent_deck_id = filterOpponentDeckId.value;
    }

    const response = await api.get('/statistics', { params });
    const data = response.data;

    const modes = ['RANK', 'RATE', 'EVENT', 'DC'];
    modes.forEach((mode) => {
      const modeData = data[mode] || {};
      // Monthly Distribution
      const monthlyLabels =
        modeData.monthly_deck_distribution?.map((d: { deck_name: string }) => d.deck_name) || [];
      const monthlySeries =
        modeData.monthly_deck_distribution?.map((d: { count: number }) => d.count) || [];
      statisticsByMode.value[mode].monthlyDistribution = {
        series: monthlySeries,
        chartOptions: {
          ...basePieChartOptions.value,
          labels: monthlyLabels,
          tooltip: {
            ...(basePieChartOptions.value.tooltip || {}),
            y: { formatter: createPiePercentFormatter(monthlySeries) },
          },
        } as ApexPieChartOptions,
      };

      // Matchup Data
      statisticsByMode.value[mode].matchupData = modeData.matchup_data || [];

      // My Deck Win Rates
      statisticsByMode.value[mode].myDeckWinRates = modeData.my_deck_win_rates || [];

      // Value Sequence Data
      const valueSequenceData: ValueSequenceEntry[] = modeData.value_sequence_data || [];
      const categories = valueSequenceData.map((_item: ValueSequenceEntry, i: number) =>
        String(i + 1),
      );
      const seriesData = valueSequenceData.map((d: ValueSequenceEntry) => d.value);
      statisticsByMode.value[mode].valueSequence = {
        series: [{ name: mode, data: seriesData }],
        chartOptions: {
          ...baseLineChartOptions.value,
          xaxis: {
            ...baseLineChartOptions.value.xaxis,
            categories,
            labels: {
              ...(baseLineChartOptions.value.xaxis?.labels || {}),
              formatter: createLabelFormatter(categories.length),
            },
          },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        } as ApexLineChartOptions,
      };
    });
  } catch (error) {
    logger.error('Failed to fetch statistics');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshStatisticsWithDecks();
});

watch(currentTab, (newMode) => {
  uiStore.setLastGameMode(newMode);
  // Clear cache when switching tabs
  lastFetchParams.value = null;
  refreshStatisticsWithDecks();
});

// テーマ変更時にグラフを再描画
watch(
  () => themeStore.isDark,
  () => {
    // Clear cache when theme changes
    lastFetchParams.value = null;
    Promise.all([
      fetchStatistics(),
      fetchMonthlyDuels(currentTab.value as GameMode),
    ]);
  },
);
</script>

<style scoped lang="scss">
.statistics-title {
  color: rgb(var(--v-theme-on-surface));
}

.filter-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.stats-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px !important;
  background-color: rgba(var(--v-theme-surface), 0.92);
}

.mode-tab-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: rgba(var(--v-theme-on-surface), 0.65);

  p {
    color: inherit;
  }
}

:deep(.stats-card .v-card-title) {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

:deep(.stats-card .v-card-text) {
  color: rgb(var(--v-theme-on-surface));
}

.matchup-table {
  background: transparent !important;
}

:deep(.matchup-table .v-data-table__th) {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  color: rgba(var(--v-theme-on-surface), 0.75) !important;
  font-weight: 600 !important;
}

:deep(.matchup-table .v-data-table__td) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  color: rgba(var(--v-theme-on-surface), 0.9);
}
</style>
