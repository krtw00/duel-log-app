<template>
  <div>
    <!-- Simple App Bar for shared view -->
    <v-app-bar app flat color="transparent">
      <v-toolbar-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-chart-bar</v-icon>
        <span class="text-h6">Duel Log Shared Statistics</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- View Toggle (Dashboard / Statistics) -->
      <v-btn-toggle
        v-model="currentView"
        mandatory
        color="primary"
        variant="outlined"
        divided
        class="mr-4"
      >
        <v-btn value="dashboard">
          <v-icon start>mdi-view-dashboard</v-icon>
          ダッシュボード
        </v-btn>
        <v-btn value="statistics">
          <v-icon start>mdi-chart-bar</v-icon>
          統計
        </v-btn>
      </v-btn-toggle>
      <v-btn
        :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="themeStore.toggleTheme"
        class="mr-2"
      />
    </v-app-bar>

    <v-main class="main-content">
      <v-container fluid class="pa-6 pa-sm-6 pa-xs-3">
        <v-row justify="center">
          <v-col cols="12">
            <v-card class="shared-stats-card" :loading="sharedStatisticsStore.loading">
              <v-card-title class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-share-variant</v-icon>
                  <span class="text-h6">{{ displayMonth }}の統計データ</span>
                </div>
                <div>
                  <v-btn color="secondary" @click="exportCSV">
                    <v-icon start>mdi-download</v-icon>
                    CSVエクスポート
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text v-if="processedStats">
                <!-- 統計フィルター -->
                <statistics-filter
                  v-model:period-type="filterPeriodType"
                  v-model:range-start="filterRangeStart"
                  v-model:range-end="filterRangeEnd"
                  v-model:my-deck-id="filterMyDeckId"
                  :available-my-decks="availableMyDecks"
                  @update:period-type="refreshStatistics"
                  @update:range-start="refreshStatistics"
                  @update:range-end="refreshStatistics"
                  @update:my-deck-id="refreshStatistics"
                  @reset="resetFilters"
                />

                <!-- ゲームモード切り替えタブ -->
                <v-card class="mode-tab-card mb-4">
                  <v-tabs v-model="currentGameMode" color="primary" align-tabs="center" height="64">
                    <v-tab
                      v-for="mode in availableGameModes"
                      :key="mode"
                      :value="mode"
                      class="custom-tab"
                    >
                      <v-icon start>{{ getGameModeIcon(mode) }}</v-icon>
                      {{ getGameModeDisplayName(mode) }}
                      <v-chip
                        v-if="getDuelCount(mode) > 0"
                        size="small"
                        class="ml-2"
                        :color="currentGameMode === mode ? 'primary' : 'default'"
                      >
                        {{ getDuelCount(mode) }}
                      </v-chip>
                    </v-tab>
                  </v-tabs>
                </v-card>

                <!-- Dashboard View -->
                <div v-if="currentView === 'dashboard'">
                  <v-window v-model="currentGameMode">
                    <v-window-item v-for="mode in availableGameModes" :key="mode" :value="mode">
                      <dashboard-content
                        v-if="processedStats && processedStats[mode]"
                        :overall-stats="(processedStats[mode] as DashboardModeData).overall_stats"
                        :duels="(processedStats[mode] as DashboardModeData).duels"
                        :loading="sharedStatisticsStore.loading"
                        :is-shared="true"
                      />
                    </v-window-item>
                  </v-window>
                </div>

                <!-- Statistics View -->
                <div v-if="currentView === 'statistics'">
                  <v-window v-model="currentGameMode">
                    <v-window-item v-for="mode in availableGameModes" :key="mode" :value="mode">
                      <statistics-content
                        v-if="processedStats && processedStats[mode]"
                        :statistics="processedStats[mode] as DashboardModeData"
                        :game-mode="mode"
                        :display-month="displayMonth"
                        :loading="sharedStatisticsStore.loading"
                        :is-shared="true"
                      />
                    </v-window-item>
                  </v-window>
                </div>
              </v-card-text>
              <v-card-text v-else-if="!sharedStatisticsStore.loading">
                <v-alert type="error" variant="tonal">
                  共有統計データを読み込めませんでした。リンクが有効期限切れか、存在しない可能性があります。
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSharedStatisticsStore } from '@/stores/shared_statistics';
import { useThemeStore } from '@/stores/theme';
import { useChartOptions } from '@/composables/useChartOptions';
import DashboardContent from '@/components/dashboard/DashboardContent.vue';
import StatisticsContent from '@/components/statistics/StatisticsContent.vue';
import StatisticsFilter from '@/components/statistics/StatisticsFilter.vue';
import { api } from '@/services/api';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const themeStore = useThemeStore();
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

// --- Types ---
import type { ApexPieChartOptions, ApexLineChartOptions } from '@/types/chart';
import type { MatchupData } from '@/types';

interface DistributionData {
  series: number[];
  chartOptions: ApexPieChartOptions;
}

interface ValueSequenceChartData {
  series: { name: string; data: number[] }[];
  chartOptions: ApexLineChartOptions;
}

interface StatisticsModeData {
  year: number; // Add year and month to this interface
  month: number;
  monthlyDistribution: DistributionData;
  recentDistribution: DistributionData;
  matchupData: MatchupData[];
  valueSequence: ValueSequenceChartData;
}

interface DuelStats {
  total_duels?: number;
  win_count?: number;
  lose_count?: number;
  win_rate?: number;
  first_turn_win_rate?: number;
  second_turn_win_rate?: number;
  coin_win_rate?: number;
  go_first_rate?: number;
}

interface MyDeckWinRate {
  deck_name: string;
  total_duels: number;
  wins: number;
  win_rate: number;
}

interface DashboardModeData {
  overall_stats?: DuelStats;
  duels?: Array<Record<string, unknown>>;
  year?: number;
  month?: number;
  monthlyDistribution?: DistributionData;
  recentDistribution?: DistributionData;
  myDeckWinRates?: MyDeckWinRate[];
  matchupData?: MatchupData[];
  valueSequence?: ValueSequenceChartData;
}

type GameMode = 'RANK' | 'RATE' | 'EVENT' | 'DC';

interface AllStatisticsData {
  [key: string]: DashboardModeData | StatisticsModeData;
}

const route = useRoute();
const sharedStatisticsStore = useSharedStatisticsStore();

const processedStats = ref<AllStatisticsData | null>(null);
const currentView = ref<'dashboard' | 'statistics'>('dashboard'); // Default to dashboard view
const currentGameMode = ref<GameMode>('RANK'); // Default to RANK mode
const gameModes: GameMode[] = ['RANK', 'RATE', 'EVENT', 'DC'];
const displayYear = ref<number>(new Date().getFullYear()); // 表示用の年
const displayMonthNum = ref<number>(new Date().getMonth() + 1); // 表示用の月（数値）

// 表示用の年月文字列
const displayMonth = computed(() => `${displayYear.value}年${displayMonthNum.value}月`);

// 利用可能なゲームモード（データがあるもののみ）
const availableGameModes = computed(() => {
  if (!processedStats.value) return [];
  return gameModes.filter((mode) => {
    const modeData = processedStats.value![mode] as DashboardModeData;
    return modeData && modeData.overall_stats && modeData.overall_stats.total_duels! > 0;
  });
});

// ゲームモードの対戦数を取得
const getDuelCount = (mode: GameMode): number => {
  if (!processedStats.value || !processedStats.value[mode]) return 0;
  const modeData = processedStats.value[mode] as DashboardModeData;
  return modeData.overall_stats?.total_duels ?? 0;
};

// --- Date Selection ---
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

// --- Filter Settings ---
const filterPeriodType = ref<'all' | 'range'>('all');
const filterRangeStart = ref(1);
const filterRangeEnd = ref(30);
const filterMyDeckId = ref<number | null>(null);

// 利用可能なデッキリスト
const availableMyDecks = computed(() => {
  if (!processedStats.value) return [];
  const decks = new Map<number, string>();

  // すべてのゲームモードから自分のデッキを収集
  gameModes.forEach((mode) => {
    const modeData = processedStats.value![mode] as DashboardModeData;
    if (modeData && modeData.duels) {
      modeData.duels.forEach((duel: any) => {
        if (duel.deck_id && duel.deck_name) {
          decks.set(duel.deck_id, duel.deck_name);
        }
      });
    }
  });

  return Array.from(decks, ([id, name]) => ({ id, name }));
});

// --- Chart Base Options ---
// baseChartOptions と lineChartBaseOptions は useChartOptions から取得
// basePieChartOptions と baseLineChartOptions として利用可能

const getGameModeDisplayName = (modeName: string) => {
  switch (modeName) {
    case 'DASHBOARD':
      return 'ダッシュボード';
    case 'STATISTICS':
      return '統計';
    case 'RANK':
      return 'ランク';
    case 'RATE':
      return 'レート';
    case 'EVENT':
      return 'イベント';
    case 'DC':
      return 'DC';
    default:
      return modeName;
  }
};

const getGameModeIcon = (modeName: string) => {
  switch (modeName) {
    case 'DASHBOARD':
      return 'mdi-view-dashboard';
    case 'STATISTICS':
      return 'mdi-chart-box-outline';
    case 'RANK':
      return 'mdi-crown';
    case 'RATE':
      return 'mdi-chart-line';
    case 'EVENT':
      return 'mdi-calendar-star';
    case 'DC':
      return 'mdi-trophy-variant';
    default:
      return 'mdi-help-circle';
  }
};

// フィルター適用後の統計データ再取得
const refreshStatistics = () => {
  fetchSharedStatistics();
};

// フィルターをリセット
const resetFilters = () => {
  filterPeriodType.value = 'all';
  filterRangeStart.value = 1;
  filterRangeEnd.value = 30;
  filterMyDeckId.value = null;
  refreshStatistics();
};

const exportCSV = async () => {
  const shareId = route.params.share_id as string;
  notificationStore.info('CSVファイルを生成しています...');
  try {
    const response = await api.get(`/shared-statistics/${shareId}/export/csv`, {
      params: {
        year: displayYear.value,
        month: displayMonthNum.value,
      },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `duels_${displayYear.value}_${displayMonthNum.value}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notificationStore.success('CSVファイルをダウンロードしました。');
  } catch (error) {
    console.error('Failed to export CSV:', error);
    notificationStore.error('CSVのエクスポートに失敗しました。');
  }
};

const fetchSharedStatistics = async () => {
  const shareId = route.params.share_id as string;
  if (!shareId) {
    console.error('Share ID is missing.');
    return;
  }

  sharedStatisticsStore.loading = true;
  try {
    // 共有リンクから取得する際は、選択された年月とフィルター設定を使用
    // periodTypeが'all'の場合はrangeStart/Endをnullにして全データを取得
    const success = await sharedStatisticsStore.getSharedStatistics(
      shareId,
      selectedYear.value,
      selectedMonth.value,
      {
        periodType: filterPeriodType.value,
        rangeStart: filterPeriodType.value === 'range' ? filterRangeStart.value : null,
        rangeEnd: filterPeriodType.value === 'range' ? filterRangeEnd.value : null,
        myDeckId: filterMyDeckId.value,
      },
    );
    if (success && sharedStatisticsStore.sharedStatsData) {
      const tempProcessedStats: AllStatisticsData = {};
      const statsData = sharedStatisticsStore.sharedStatsData;
      // Process all game modes (RANK, RATE, EVENT, DC)
      gameModes.forEach((mode) => {
        const rawStats = statsData[mode] as any;
        if (!rawStats) return;

        const rawValueSequence: { value: number }[] = rawStats.value_sequence_data || [];
        const categories = rawValueSequence.map((_item: { value: number }, i: number) =>
          String(i + 1),
        );
        const seriesData = rawValueSequence.map((d: { value: number }) => d.value);
        const step = determineStep(categories.length);

        tempProcessedStats[mode] = {
          overall_stats: rawStats.overall_stats || {},
          duels: rawStats.duels || [],
          year: rawStats.year || selectedYear.value,
          month: rawStats.month || selectedMonth.value,
          monthlyDistribution: {
            series:
              rawStats.monthly_deck_distribution?.map((d: { count: number }) => d.count) || [],
            chartOptions: {
              ...basePieChartOptions.value,
              labels:
                rawStats.monthly_deck_distribution?.map(
                  (d: { deck_name: string }) => d.deck_name,
                ) || [],
            } as ApexPieChartOptions,
          },
          recentDistribution: {
            series: rawStats.recent_deck_distribution?.map((d: { count: number }) => d.count) || [],
            chartOptions: {
              ...basePieChartOptions.value,
              labels:
                rawStats.recent_deck_distribution?.map((d: { deck_name: string }) => d.deck_name) ||
                [],
            } as ApexPieChartOptions,
          },
          myDeckWinRates: rawStats.my_deck_win_rates || [],
          matchupData: rawStats.matchup_data || [],
          valueSequence: {
            series: [
              {
                name: mode,
                data: seriesData,
              },
            ],
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
          },
        };
      });

      processedStats.value = tempProcessedStats;

      // 共有リンクの年月を表示用に設定（最初のゲームモードから取得）
      const firstMode = gameModes.find((mode) => tempProcessedStats[mode]);
      if (firstMode) {
        const modeData = tempProcessedStats[firstMode] as DashboardModeData;
        displayYear.value = modeData.year || selectedYear.value;
        displayMonthNum.value = modeData.month || selectedMonth.value;
      }

      // 最初の利用可能なゲームモードを選択
      const firstAvailableMode = gameModes.find((mode) => {
        const modeData = tempProcessedStats[mode] as DashboardModeData;
        return modeData && modeData.overall_stats && modeData.overall_stats.total_duels! > 0;
      });
      if (firstAvailableMode) {
        currentGameMode.value = firstAvailableMode;
      }
    } else {
      processedStats.value = null; // Clear stats if fetch failed
    }
  } catch (error) {
    console.error('Failed to fetch shared statistics:', error);
    processedStats.value = null;
  } finally {
    sharedStatisticsStore.loading = false;
  }
};

onMounted(() => {
  fetchSharedStatistics();
});

// テーマ変更時にグラフを再描画
watch(
  () => themeStore.isDark,
  () => {
    fetchSharedStatistics();
  },
);

// Expose for testing
defineExpose({
  selectedYear,
  selectedMonth,
  displayYear,
  displayMonth,
  processedStats,
  fetchSharedStatistics,
});
</script>

<style scoped lang="scss">
.main-content {
  min-height: 100vh;
  padding-top: 64px; /* Adjust for app bar height */
}

.shared-stats-card {
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px !important;
  color: rgb(var(--v-theme-on-surface));

  .v-card-title {
    color: rgb(var(--v-theme-primary));
  }

  .v-list-item-title {
    color: rgb(var(--v-theme-on-surface));
  }

  .v-table {
    background: transparent !important;
    color: rgb(var(--v-theme-on-surface));

    th {
      color: rgb(var(--v-theme-primary)) !important;
    }
    td {
      color: rgb(var(--v-theme-on-surface)) !important;
    }
  }
}

.stats-card {
  backdrop-filter: blur(10px);
  border-radius: 12px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  color: rgb(var(--v-theme-on-surface));
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

.stats-card--dark {
  background: rgba(18, 22, 46, 0.95) !important;
  border-color: rgba(0, 217, 255, 0.1);
  color: #fff;
}

.stats-card--dark .v-card-title {
  color: #fff;
}

.stats-card--light {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(15, 23, 42, 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.stats-card--light .v-card-title {
  color: rgb(var(--v-theme-primary));
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
}

.mode-tab-card {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px !important;
}

.custom-tab {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.25px;
  min-width: 120px;

  .v-chip {
    font-weight: 600;
  }
}
</style>
