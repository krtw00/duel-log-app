<template>
  <div>
    <!-- Simple App Bar for shared view -->
    <v-app-bar app flat color="transparent">
      <v-toolbar-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-chart-bar</v-icon>
        <span class="text-h6">Duel Log Shared Statistics</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
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
          <v-col cols="12" md="11" lg="10" xl="9">
            <v-card class="shared-stats-card" :loading="sharedStatisticsStore.loading">
              <v-card-title class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-share-variant</v-icon>
                  <span class="text-h6">共有統計データ</span>
                </div>
                <div>
                  <v-chip v-if="processedStats && currentTab" color="info" variant="outlined" class="mr-2">
                    {{ getGameModeDisplayName(currentTab) }}
                    -
                    {{ displayYear }}年 {{ displayMonth }}月
                  </v-chip>
                  <v-btn color="secondary" @click="exportCSV">
                    <v-icon start>mdi-download</v-icon>
                    CSVエクスポート
                  </v-btn>
                </div>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text v-if="processedStats && currentTab">
                <!-- ゲームモード切り替えタブ -->
                <v-card class="mode-tab-card mb-4">
                  <v-tabs
                    v-model="currentTab"
                    color="primary"
                    align-tabs="center"
                    height="64"
                    @update:model-value="fetchSharedStatistics"
                  >
                    <v-tab
                      v-for="mode in displayModes"
                      :key="mode"
                      :value="mode"
                      class="custom-tab"
                    >
                      <v-icon start>{{ getGameModeIcon(mode) }}</v-icon>
                      {{ getGameModeDisplayName(mode) }}
                    </v-tab>
                  </v-tabs>
                </v-card>

                <v-window v-model="currentTab">
                  <v-window-item v-for="mode in displayModes" :key="mode" :value="mode">
                    <!-- DASHBOARDタブ -->
                    <div v-if="mode === 'DASHBOARD' && processedStats['DASHBOARD']">
                      <h3 class="text-h5 mb-4 mt-4">ダッシュボード</h3>

                      <v-row class="mb-4">
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="総試合数"
                            :value="(processedStats['DASHBOARD'] as DuelStats).total_duels"
                            icon="mdi-sword-cross"
                            color="primary"
                          />
                        </v-col>
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="勝率"
                            :value="`${((processedStats['DASHBOARD'] as DuelStats).win_rate * 100).toFixed(1)}%`"
                            icon="mdi-trophy"
                            color="success"
                          />
                        </v-col>
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="先攻勝率"
                            :value="`${((processedStats['DASHBOARD'] as DuelStats).first_turn_win_rate * 100).toFixed(1)}%`"
                            icon="mdi-lightning-bolt"
                            color="warning"
                          />
                        </v-col>
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="後攻勝率"
                            :value="`${((processedStats['DASHBOARD'] as DuelStats).second_turn_win_rate * 100).toFixed(1)}%`"
                            icon="mdi-shield"
                            color="secondary"
                          />
                        </v-col>
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="コイン勝率"
                            :value="`${((processedStats['DASHBOARD'] as DuelStats).coin_win_rate * 100).toFixed(1)}%`"
                            icon="mdi-poker-chip"
                            color="yellow"
                          />
                        </v-col>
                        <v-col cols="6" sm="4" md="2" lg="2">
                          <stat-card
                            title="先攻率"
                            :value="`${((processedStats['DASHBOARD'] as DuelStats).go_first_rate * 100).toFixed(1)}%`"
                            icon="mdi-arrow-up-bold-hexagon-outline"
                            color="teal"
                          />
                        </v-col>
                      </v-row>

                      <!-- 対戦履歴 -->
                      <v-card
                        v-if="
                          (processedStats['DASHBOARD'] as any).duels &&
                          (processedStats['DASHBOARD'] as any).duels.length > 0
                        "
                        class="duel-card mt-4"
                      >
                        <v-card-title class="pa-4">
                          <div class="d-flex align-center mb-3">
                            <v-icon class="mr-2" color="primary">mdi-table</v-icon>
                            <span class="text-h6">対戦履歴</span>
                          </div>
                        </v-card-title>
                        <v-divider />
                        <duel-table
                          :duels="(processedStats['DASHBOARD'] as any).duels"
                          :loading="sharedStatisticsStore.loading"
                        />
                      </v-card>
                      <div v-else class="no-data-placeholder py-8">
                        <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
                        <p class="text-body-1 text-grey mt-4">対戦履歴がありません</p>
                      </div>
                    </div>

                    <!-- STATISTICSタブ -->
                    <div v-else-if="mode === 'STATISTICS' && processedStats['STATISTICS']">
                      <h3 class="text-h5 mb-4 mt-4">統計</h3>
                      <v-row>
                        <!-- 月間デッキ分布 -->
                        <v-col cols="12" md="6">
                          <v-card class="stats-card">
                            <v-card-title>相手デッキ分布 (月間)</v-card-title>
                            <v-card-text>
                              <apexchart
                                v-if="
                                  (processedStats[mode] as StatisticsModeData).monthlyDistribution &&
                                  (processedStats[mode] as StatisticsModeData).monthlyDistribution.series &&
                                  (processedStats[mode] as StatisticsModeData).monthlyDistribution.series.length > 0
                                "
                                type="pie"
                                height="350"
                                :options="(processedStats[mode] as StatisticsModeData).monthlyDistribution.chartOptions"
                                :series="(processedStats[mode] as StatisticsModeData).monthlyDistribution.series"
                              ></apexchart>
                              <div v-else class="no-data-placeholder">
                                <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
                                <p class="text-body-1 text-grey mt-4">データがありません</p>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>

                        <!-- 直近30戦デッキ分布 -->
                        <v-col cols="12" md="6">
                          <v-card class="stats-card">
                            <v-card-title>直近30戦デッキ分布</v-card-title>
                            <v-card-text>
                              <apexchart
                                v-if="
                                  (processedStats[mode] as StatisticsModeData).recentDistribution &&
                                  (processedStats[mode] as StatisticsModeData).recentDistribution.series &&
                                  (processedStats[mode] as StatisticsModeData).recentDistribution.series.length > 0
                                "
                                type="pie"
                                height="350"
                                :options="(processedStats[mode] as StatisticsModeData).recentDistribution.chartOptions"
                                :series="(processedStats[mode] as StatisticsModeData).recentDistribution.series"
                              ></apexchart>
                              <div v-else class="no-data-placeholder">
                                <v-icon size="64" color="grey">mdi-chart-donut</v-icon>
                                <p class="text-body-1 text-grey mt-4">データがありません</p>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>

                        <!-- 相性表 -->
                        <v-col cols="12">
                          <v-card class="stats-card">
                            <v-card-title>デッキ相性表</v-card-title>
                            <v-card-text>
                              <div
                                v-if="
                                  (processedStats[mode] as StatisticsModeData).matchupData &&
                                  (processedStats[mode] as StatisticsModeData).matchupData.length > 0
                                "
                              >
                                <v-data-table
                                  :headers="matchupHeaders"
                                  :items="(processedStats[mode] as StatisticsModeData).matchupData"
                                  class="matchup-table"
                                  density="compact"
                                >
            <template #[`item.win_rate`]='{ item }'>
              {{ item.wins }} / {{ item.total_duels }} ({{ item.total_duels > 0 ? (item.wins / item.total_duels * 100).toFixed(1) : 0 }}%)
            </template>
                                </v-data-table>
                              </div>
                              <div v-else class="no-data-placeholder py-8">
                                <v-icon size="64" color="grey">mdi-table-off</v-icon>
                                <p class="text-body-1 text-grey mt-4">相性データがありません</p>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>

                        <!-- レート/DC変動グラフ (RATEとDCタブのみ) -->
                        <v-col v-if="mode === 'STATISTICS'" cols="12" style="display: none;">
                          <v-card class="stats-card">
                            <v-card-title>変動グラフ</v-card-title>
                            <v-card-text>
                              <apexchart
                                v-if="
                                  (processedStats[mode] as StatisticsModeData).timeSeries &&
                                  (processedStats[mode] as StatisticsModeData).timeSeries.series &&
                                  (processedStats[mode] as StatisticsModeData).timeSeries.series[0] &&
                                  (processedStats[mode] as StatisticsModeData).timeSeries.series[0].data &&
                                  (processedStats[mode] as StatisticsModeData).timeSeries.series[0].data.length > 0
                                "
                                type="line"
                                height="350"
                                :options="(processedStats[mode] as StatisticsModeData).timeSeries.chartOptions"
                                :series="(processedStats[mode] as StatisticsModeData).timeSeries.series"
                              ></apexchart>
                              <div v-else class="no-data-placeholder">
                                <v-icon size="64" color="grey">{{
                                  'mdi-chart-line'
                                }}</v-icon>
                                <p class="text-body-1 text-grey mt-4">データがありません</p>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                  </v-window-item>
                </v-window>
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSharedStatisticsStore } from '@/stores/shared_statistics';
import { useThemeStore } from '@/stores/theme';
import StatCard from '@/components/duel/StatCard.vue';
import DuelTable from '@/components/duel/DuelTable.vue';
import { api } from '@/services/api';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const themeStore = useThemeStore();

// --- Types ---
interface DistributionData {
  series: number[];
  chartOptions: any;
}

interface TimeSeriesData {
  series: { name: string; data: number[] }[];
  chartOptions: any;
}

interface StatisticsModeData {
  year: number; // Add year and month to this interface
  month: number;
  monthlyDistribution: DistributionData;
  recentDistribution: DistributionData;
  matchupData: any[];
  timeSeries: TimeSeriesData;
}

interface AllStatisticsData {
  [key: string]: StatisticsModeData | DuelStats; // Allow DuelStats for DASHBOARD
}

interface DuelStats {
  total_duels: number;
  win_count: number;
  lose_count: number;
  win_rate: number;
  first_turn_win_rate: number;
  second_turn_win_rate: number;
  coin_win_rate: number;
  go_first_rate: number;
}

const route = useRoute();
const sharedStatisticsStore = useSharedStatisticsStore();

const processedStats = ref<AllStatisticsData | null>(null);
const currentTab = ref('DASHBOARD'); // Default to DASHBOARD tab
const displayYear = ref<number>(new Date().getFullYear()); // 表示用の年
const displayMonth = ref<number>(new Date().getMonth() + 1); // 表示用の月

// --- Date Selection ---
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

const availableGameModes = computed(() => {
  if (!processedStats.value) return [];
  return Object.keys(processedStats.value);
});

const displayModes = computed(() => {
  const modes = ['DASHBOARD']; // Always include DASHBOARD
  if (availableGameModes.value.includes('STATISTICS')) modes.push('STATISTICS');
  return modes;
});
// --- Chart Base Options ---
const baseChartOptions = computed(() => ({
  chart: { type: 'pie', background: 'transparent' },
  labels: [],
  theme: {
    mode: themeStore.isDark ? 'dark' : 'light',
  },
  colors: ['#00D9FF', '#FF4560', '#775DD0', '#FEB019', '#00E396', '#D4526E', '#3F51B5', '#26A69A', '#E91E63', '#FFC107'],
  legend: {
    position: 'bottom',
    labels: {
      colors: themeStore.isDark ? '#fff' : '#000',
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' },
      },
    },
  ],
}));

const lineChartBaseOptions = computed(() => ({
  chart: {
    type: 'line',
    background: 'transparent',
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  xaxis: {
    type: 'numeric',
    title: { text: '対戦数', style: { color: themeStore.isDark ? '#E4E7EC' : '#333' } },
    labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } },
  },
  yaxis: { labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } } },
  stroke: { curve: 'smooth', width: 3 },
  markers: {
    size: 4,
    colors: ['#00d9ff'],
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 7 },
  },
  grid: { borderColor: 'rgba(0, 217, 255, 0.1)', strokeDashArray: 4 },
  tooltip: { theme: themeStore.isDark ? 'dark' : 'light' },
  dataLabels: { enabled: false },
  theme: { mode: themeStore.isDark ? 'dark' : 'light' },
}));

// --- Data Table ---
const matchupHeaders = [
  { title: '使用デッキ', key: 'deck_name', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
];

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

const exportCSV = async () => {
  const shareId = route.params.share_id as string;
  notificationStore.info('CSVファイルを生成しています...');
  try {
    const response = await api.get(`/shared-statistics/${shareId}/export/csv`, {
      params: {
        year: displayYear.value,
        month: displayMonth.value,
      },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `duels_${displayYear.value}_${displayMonth.value}.csv`;
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
    // 共有リンクから取得する際は、選択された年月を使用
    const success = await sharedStatisticsStore.getSharedStatistics(
      shareId,
      selectedYear.value,
      selectedMonth.value,
    );
    if (success && sharedStatisticsStore.sharedStatsData) {
      const tempProcessedStats: AllStatisticsData = {};
      const statsData = sharedStatisticsStore.sharedStatsData;
      // Process game mode specific statistics
      Object.keys(statsData).forEach((mode) => {
        const rawStats = statsData[mode];

        if (mode === 'DASHBOARD') {
          // Process DASHBOARD data
          const dashboardStats = rawStats as any;
          const transformedDuels = (dashboardStats.duels || []).map((d: any) => ({
            ...d,
            deck: { name: d.deck_name },
            opponentdeck: { name: d.opponent_deck_name },
          }));
          tempProcessedStats['DASHBOARD'] = {
            ...(dashboardStats.overall_stats || {}),
            duels: transformedDuels,
          } as any;
        } else if (mode === 'STATISTICS') {
          // Process STATISTICS data (all game modes combined)
          tempProcessedStats['STATISTICS'] = {
            year: (rawStats as any).year || selectedYear.value,
            month: (rawStats as any).month || selectedMonth.value,
            monthlyDistribution: {
              series: rawStats.monthly_deck_distribution?.map((d: any) => d.count) || [],
              chartOptions: {
                ...baseChartOptions.value,
                labels: rawStats.monthly_deck_distribution?.map((d: any) => d.deck_name) || [],
              },
            },
            recentDistribution: {
              series: rawStats.recent_deck_distribution?.map((d: any) => d.count) || [],
              chartOptions: {
                ...baseChartOptions.value,
                labels: rawStats.recent_deck_distribution?.map((d: any) => d.deck_name) || [],
              },
            },
            matchupData: rawStats.matchup_data || [],
            timeSeries: {
              series: [],
              chartOptions: lineChartBaseOptions.value,
            },
          };
        } else {
          // Process other game mode specific data (RANK, RATE, EVENT, DC) - though these shouldn't exist now
          tempProcessedStats[mode] = {
            year: (rawStats as any).year || selectedYear.value,
            month: (rawStats as any).month || selectedMonth.value,
            monthlyDistribution: {
              series: rawStats.monthly_deck_distribution?.map((d: any) => d.count) || [],
              chartOptions: {
                ...baseChartOptions.value,
                labels: rawStats.monthly_deck_distribution?.map((d: any) => d.deck_name) || [],
              },
            },
            recentDistribution: {
              series: rawStats.recent_deck_distribution?.map((d: any) => d.count) || [],
              chartOptions: {
                ...baseChartOptions.value,
                labels: rawStats.recent_deck_distribution?.map((d: any) => d.deck_name) || [],
              },
            },
            matchupData: rawStats.matchup_data || [],
            timeSeries: {
              series: [
                { name: mode, data: rawStats.time_series_data?.map((d: any) => d.value) || [] },
              ],
              chartOptions: {
                ...lineChartBaseOptions.value,
                xaxis: {
                  ...lineChartBaseOptions.value.xaxis,
                  categories: rawStats.time_series_data?.map((_: any, i: number) => i + 1) || [],
                },
                colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
              },
            },
          };
        }
      });

      processedStats.value = tempProcessedStats;

      // 共有リンクの年月を表示用に設定（STATISTICSまたはDASHBOARDから取得）
      if (tempProcessedStats['STATISTICS']) {
        const statsData = tempProcessedStats['STATISTICS'] as StatisticsModeData;
        displayYear.value = statsData.year;
        displayMonth.value = statsData.month;
      }

      // Initialize currentTab if it's not set or not in available modes
      if (!currentTab.value || !displayModes.value.includes(currentTab.value)) {
        if (displayModes.value.length > 0) {
          currentTab.value = displayModes.value[0];
        }
      }
    } else {
      processedStats.value = null; // Clear stats if fetch failed
      currentTab.value = ''; // Clear current tab
    }
  } catch (error) {
    console.error('Failed to fetch shared statistics:', error);
    processedStats.value = null;
    currentTab.value = ''; // Clear current tab
  } finally {
    sharedStatisticsStore.loading = false;
  }
};

onMounted(() => {
  fetchSharedStatistics();
});

watch([currentTab], fetchSharedStatistics);

// テーマ変更時にグラフを再描画
watch(() => themeStore.isDark, () => {
  fetchSharedStatistics();
});

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
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
  color: #fff;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
}
</style>
