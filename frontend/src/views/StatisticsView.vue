<template>
  <div>
    <!-- ナビゲーションバー -->
    <app-bar current-view="statistics" @toggle-drawer="drawer = !drawer" />

    <!-- レスポンシブ対応のナビゲーションドロワー -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav dense>
        <v-list-item
          v-for="item in navItems"
          :key="item.view"
          :prepend-icon="item.icon"
          :to="item.path"
          :title="item.name"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <h1 class="statistics-title text-h4 mb-6">統計情報</h1>

        <!-- 年月選択 -->
        <v-row class="mb-4">
          <v-col cols="6" sm="3">
            <v-select
              v-model="selectedYear"
              :items="years"
              label="年"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="refreshStatisticsWithDecks"
            ></v-select>
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="selectedMonth"
              :items="months"
              label="月"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="refreshStatisticsWithDecks"
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
          @update:period-type="refreshStatisticsWithDecks"
          @update:range-start="refreshStatisticsWithDecks"
          @update:range-end="refreshStatisticsWithDecks"
          @update:my-deck-id="handleMyDeckFilterChange"
          @reset="resetFilters"
        />

        <!-- ゲームモード切り替えタブ -->
        <v-card class="mode-tab-card mb-4">
          <v-tabs v-model="currentTab" color="primary" align-tabs="center" height="64">
            <v-tab value="RANK" class="custom-tab">
              <v-icon start>mdi-crown</v-icon>
              ランク
            </v-tab>
            <v-tab value="RATE" class="custom-tab">
              <v-icon start>mdi-chart-line</v-icon>
              レート
            </v-tab>
            <v-tab value="EVENT" class="custom-tab">
              <v-icon start>mdi-calendar-star</v-icon>
              イベント
            </v-tab>
            <v-tab value="DC" class="custom-tab">
              <v-icon start>mdi-trophy-variant</v-icon>
              DC
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
            <!-- Keeping old code below for reference, can be removed later -->
            <v-row v-if="false">
              <!-- 月間デッキ分布 -->
              <v-col cols="12" lg="6">
                <v-card class="stats-card">
                  <v-card-title>月間デッキ分布 ({{ currentMonth }})</v-card-title>
                  <v-card-text>
                    <apexchart
                      v-if="
                        !loading && statisticsByMode[mode].monthlyDistribution.series.length > 0
                      "
                      type="pie"
                      height="350"
                      :options="statisticsByMode[mode].monthlyDistribution.chartOptions"
                      :series="statisticsByMode[mode].monthlyDistribution.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
                      <p class="text-body-1 text-grey mt-4">データがありません</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <!-- 月間対戦リスト -->
              <v-col cols="12" lg="6">
                <v-card class="stats-card">
                  <v-card-title class="d-flex align-center justify-space-between">
                    <span>月間対戦一覧 ({{ currentMonth }})</span>
                    <v-chip size="small" variant="outlined">
                      全 {{ monthlyDuelsByMode[mode].length }} 件
                    </v-chip>
                  </v-card-title>
                  <v-card-text>
                    <duel-table
                      :duels="monthlyDuelsByMode[mode]"
                      :loading="monthlyDuelsLoading"
                      :show-actions="false"
                      :hidden-columns="monthlyHiddenColumns"
                      table-height="480px"
                    />
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 自分のデッキ勝率 -->
              <v-col cols="12">
                <v-card class="stats-card">
                  <v-card-title>自分のデッキ勝率</v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="myDeckWinRatesHeaders"
                      :items="statisticsByMode[mode].myDeckWinRates"
                      :loading="loading"
                      class="matchup-table"
                      density="compact"
                    >
                      <template #[`item.win_rate`]="{ item }">
                        <v-chip
                          size="small"
                          :color="getMatchupColor(item.win_rate)"
                          :variant="getMatchupColor(item.win_rate) ? 'tonal' : 'outlined'"
                        >
                          {{ item.wins }} / {{ item.total_duels }} ({{ formatPercent(item.win_rate) }})
                        </v-chip>
                      </template>
                      <template #no-data>
                        <div class="no-data-placeholder py-8">
                          <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
                          <p class="text-body-1 text-grey mt-4">データがありません</p>
                        </div>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 相性表 -->
              <v-col cols="12">
                <v-card class="stats-card">
                  <v-card-title>デッキ相性表</v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="matchupHeaders"
                      :items="statisticsByMode[mode].matchupData"
                      :loading="loading"
                      class="matchup-table"
                      density="compact"
                    >
                      <template #[`item.win_rate`]="{ item }">
                        <v-chip
                          size="small"
                          :color="getMatchupColor(item.win_rate)"
                          :variant="getMatchupColor(item.win_rate) ? 'tonal' : 'outlined'"
                        >
                          {{ item.wins }} / {{ item.total_duels }} ({{ formatPercent(item.win_rate) }})
                        </v-chip>
                      </template>
                      <template #[`item.win_rate_first`]="{ item }">
                        <v-chip
                          size="small"
                          :color="getMatchupColor(item.win_rate_first)"
                          :variant="getMatchupColor(item.win_rate_first) ? 'tonal' : 'outlined'"
                        >
                          {{ formatPercent(item.win_rate_first) }}
                        </v-chip>
                      </template>
                      <template #[`item.win_rate_second`]="{ item }">
                        <v-chip
                          size="small"
                          :color="getMatchupColor(item.win_rate_second)"
                          :variant="getMatchupColor(item.win_rate_second) ? 'tonal' : 'outlined'"
                        >
                          {{ formatPercent(item.win_rate_second) }}
                        </v-chip>
                      </template>
                      <template #no-data>
                        <div class="no-data-placeholder py-8">
                          <v-icon size="64" color="grey">mdi-table-off</v-icon>
                          <p class="text-body-1 text-grey mt-4">相性データがありません</p>
                        </div>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- レート/DC変動グラフ (RATEとDCタブのみ) -->
              <v-col v-if="mode === 'RATE' || mode === 'DC'" cols="12">
                <v-card class="stats-card">
                  <v-card-title
                    >{{ mode === 'RATE' ? 'レート変動' : 'DC変動' }} ({{
                      currentMonth
                    }})</v-card-title
                  >
                  <v-card-text>
                    <apexchart
                      v-if="
                        !loading && statisticsByMode[mode].valueSequence.series[0].data.length > 0
                      "
                      type="line"
                      height="350"
                      :options="statisticsByMode[mode].valueSequence.chartOptions"
                      :series="statisticsByMode[mode].valueSequence.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">{{
                        mode === 'RATE' ? 'mdi-chart-line' : 'mdi-trophy-variant'
                      }}</v-icon>
                      <p class="text-body-1 text-grey mt-4">データがありません</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </div>
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
import { api } from '@/services/api';
import AppBar from '@/components/layout/AppBar.vue';
import { useThemeStore } from '@/stores/theme';
import { useUiStore } from '@/stores/ui';
import { useChartOptions } from '@/composables/useChartOptions';
import DuelTable from '@/components/duel/DuelTable.vue';
import StatisticsContent from '@/components/statistics/StatisticsContent.vue';
import StatisticsFilter from '@/components/statistics/StatisticsFilter.vue';

const themeStore = useThemeStore();
const uiStore = useUiStore();
const { basePieChartOptions, baseLineChartOptions } = useChartOptions();

const determineStep = (count: number) => {
  if (count <= 10) return 1;
  if (count <= 50) return 5;
  if (count <= 500) return 10;
  return 100;
};

const createLabelFormatter = (step: number, total: number) => {
  return (value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return value;
    }
    if (numeric === 1 || numeric === total) {
      return value;
    }
    return numeric % step === 0 ? value : '';
  };
};

const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

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
const currentMonth = computed(() => `${selectedYear.value}年${selectedMonth.value}月`);

// --- Filter Settings ---
const filterPeriodType = ref<'all' | 'range'>('all');
const filterRangeStart = ref(1);
const filterRangeEnd = ref(30);
const filterMyDeckId = ref<number | null>(null);
const filterOpponentDeckId = ref<number | null>(null);

const availableMyDecks = ref<{ id: number; name: string }[]>([]);
const availableOpponentDecks = ref<{ id: number; name: string }[]>([]);

const resetFilters = () => {
  filterPeriodType.value = 'all';
  filterRangeStart.value = 1;
  filterRangeEnd.value = 30;
  filterMyDeckId.value = null;
  filterOpponentDeckId.value = null;
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
const monthlyDuelsLoading = ref(false);
const monthlyHiddenColumns = ['opponentdeck', 'coin', 'first_or_second', 'notes'];

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
    console.error('Failed to fetch available decks:', error);
  }
};

const refreshStatisticsWithDecks = async () => {
  await fetchAvailableDecks();
  await fetchStatistics();
  await fetchMonthlyDuels(currentTab.value as GameMode);
};

const handleMyDeckFilterChange = async () => {
  await fetchStatistics();
  await fetchMonthlyDuels(currentTab.value as GameMode);
};

const resolveDeckName = (deckId: number): string => {
  const deck = availableMyDecks.value.find((d) => d.id === deckId);
  return deck ? deck.name : '不明';
};

const resolveOpponentDeckName = (deckId: number): string => {
  const deck = availableOpponentDecks.value.find((d) => d.id === deckId);
  return deck ? deck.name : '不明';
};

const buildDeckStub = (id: number, name: string, isOpponent: boolean, userId: number): Deck => ({
  id,
  name,
  is_opponent: isOpponent,
  active: true,
  user_id: userId,
});

const fetchMonthlyDuels = async (mode: GameMode) => {
  monthlyDuelsLoading.value = true;
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
    console.error('Failed to fetch monthly duels:', error);
    monthlyDuelsByMode.value[mode] = [];
  } finally {
    monthlyDuelsLoading.value = false;
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

    const response = await api.get('/statistics/', { params });
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
      const step = determineStep(categories.length);
      statisticsByMode.value[mode].valueSequence = {
        series: [{ name: mode, data: seriesData }],
        chartOptions: {
          ...baseLineChartOptions.value,
          xaxis: {
            ...baseLineChartOptions.value.xaxis,
            categories,
            labels: {
              ...(baseLineChartOptions.value.xaxis?.labels || {}),
              formatter: createLabelFormatter(step, categories.length),
            },
          },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        } as ApexLineChartOptions,
      };
    });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
  } finally {
    loading.value = false;
  }
};

// --- Data Table ---
const matchupHeaders = [
  { title: '使用デッキ', key: 'deck_name', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
  { title: '先攻勝率', key: 'win_rate_first', sortable: true },
  { title: '後攻勝率', key: 'win_rate_second', sortable: true },
];

const myDeckWinRatesHeaders = [
  { title: 'デッキ名', key: 'deck_name', sortable: true },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
];

const normalizePercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  // Some APIs might send ratios (0-1). Convert to percent for consistent UI.
  return value <= 1 ? value * 100 : value;
};

const formatPercent = (value: number) => `${normalizePercent(value).toFixed(1)}%`;

// 優勢: 青 / 劣勢: 赤（ユーザー要望により色相を反転）
const getMatchupColor = (value: number) => {
  const percent = normalizePercent(value);
  if (percent >= 55) return 'info';
  if (percent <= 45) return 'error';
  return undefined;
};

onMounted(() => {
  refreshStatisticsWithDecks();
});

watch(currentTab, (newMode) => {
  uiStore.setLastGameMode(newMode);
  refreshStatisticsWithDecks();
});

// テーマ変更時にグラフを再描画
watch(
  () => themeStore.isDark,
  () => {
    fetchStatistics();
    fetchMonthlyDuels(currentTab.value as GameMode);
  },
);
</script>

<style scoped lang="scss">
.main-content {
  min-height: 100vh;
}

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
