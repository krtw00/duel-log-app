<template>
  <v-card class="meta-analysis-card">
    <v-card-title class="pa-6">
      <v-icon class="mr-2" color="primary">mdi-chart-timeline-variant</v-icon>
      <span class="text-h5">{{ LL?.admin.meta?.title() || 'メタ分析' }}</span>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedPeriod"
            :items="periodOptions"
            item-title="label"
            item-value="value"
            :label="LL?.admin.meta?.period() || '期間'"
            variant="outlined"
            density="comfortable"
            hide-details
            @update:model-value="loadData"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedGameMode"
            :items="gameModeOptions"
            item-title="label"
            item-value="value"
            :label="LL?.admin.meta?.gameMode() || 'ゲームモード'"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @update:model-value="loadData"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="minUsage"
            :items="minUsageOptions"
            item-title="label"
            item-value="value"
            :label="LL?.admin.meta?.minUsage() || '最小使用回数'"
            variant="outlined"
            density="comfortable"
            hide-details
            @update:model-value="loadPopularDecks"
          />
        </v-col>
      </v-row>

      <!-- Popular Decks Ranking -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">
          <v-icon start size="small">mdi-trophy</v-icon>
          {{ LL?.admin.meta?.popularDecks() || '人気デッキランキング' }}
        </h3>

        <v-skeleton-loader v-if="loadingPopular" type="table-row@5" />

        <v-data-table
          v-else
          :headers="popularDecksHeaders"
          :items="popularDecks"
          :items-per-page="10"
          density="comfortable"
          class="elevation-1"
        >
          <template #item.rank="{ item }">
            <v-chip
              :color="getRankColor(item.rank)"
              size="small"
              variant="flat"
            >
              #{{ item.rank }}
            </v-chip>
          </template>

          <template #item.win_rate="{ item }">
            <span :class="getWinRateClass(item.win_rate)">
              {{ item.win_rate.toFixed(1) }}%
            </span>
          </template>

          <template #item.win_loss="{ item }">
            <span class="text-success">{{ item.win_count }}W</span>
            /
            <span class="text-error">{{ item.loss_count }}L</span>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              <v-icon size="48" color="grey">mdi-chart-bar</v-icon>
              <p class="mt-2">{{ LL?.admin.meta?.noData() || 'データがありません' }}</p>
            </div>
          </template>
        </v-data-table>

        <div v-if="popularDecksResponse" class="text-caption text-grey mt-2">
          {{ LL?.admin.meta?.totalDuels() || '総対戦数' }}: {{ popularDecksResponse.total_duels }}
        </div>
      </div>

      <!-- Deck Trends Chart -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">
          <v-icon start size="small">mdi-chart-line</v-icon>
          {{ LL?.admin.meta?.deckTrends() || 'デッキ使用率推移' }}
        </h3>

        <v-skeleton-loader v-if="loadingTrends" type="image" height="300" />

        <div v-else-if="deckTrendsData.length > 0" class="trends-chart-container">
          <canvas ref="trendsChartRef" height="300"></canvas>
        </div>

        <div v-else class="text-center pa-4">
          <v-icon size="48" color="grey">mdi-chart-line</v-icon>
          <p class="mt-2">{{ LL?.admin.meta?.noData() || 'データがありません' }}</p>
        </div>
      </div>

      <!-- Game Mode Stats -->
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-3">
          <v-icon start size="small">mdi-gamepad-variant</v-icon>
          {{ LL?.admin.meta?.gameModeStats() || 'ゲームモード別統計' }}
        </h3>

        <v-skeleton-loader v-if="loadingGameMode" type="card" />

        <v-row v-else>
          <v-col cols="12" md="6">
            <div class="game-mode-chart-container">
              <canvas ref="gameModeChartRef" height="250"></canvas>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item
                v-for="stat in gameModeStats"
                :key="stat.game_mode"
                class="py-2"
              >
                <template #prepend>
                  <v-icon :color="getGameModeColor(stat.game_mode)">
                    {{ getGameModeIcon(stat.game_mode) }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ stat.game_mode }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ stat.duel_count }}対戦 / {{ stat.user_count }}ユーザー
                </v-list-item-subtitle>
                <template #append>
                  <v-chip size="small" variant="outlined">
                    {{ stat.percentage.toFixed(1) }}%
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useLocale } from '@/composables/useLocale';
import { useNotificationStore } from '@/stores/notification';
import {
  getPopularDecks,
  getDeckTrends,
  getGameModeStats,
} from '@/services/adminApi';
import type {
  PopularDecksResponse,
  DeckRanking,
  DeckTrendEntry,
  GameModeStatDetail,
} from '@/types/admin';
import Chart from 'chart.js/auto';

const { LL } = useLocale();
const notificationStore = useNotificationStore();

// Filters
const selectedPeriod = ref(30);
const selectedGameMode = ref<string | null>(null);
const minUsage = ref(5);

const periodOptions = computed(() => [
  { value: 7, label: LL.value?.admin.meta?.period7days() || '7日間' },
  { value: 14, label: LL.value?.admin.meta?.period14days() || '14日間' },
  { value: 30, label: LL.value?.admin.meta?.period30days() || '30日間' },
  { value: 60, label: LL.value?.admin.meta?.period60days() || '60日間' },
  { value: 90, label: LL.value?.admin.meta?.period90days() || '90日間' },
]);

const gameModeOptions = computed(() => [
  { value: 'RANK', label: LL.value?.duels.gameMode.rank() || 'ランク' },
  { value: 'RATE', label: LL.value?.duels.gameMode.rate() || 'レート' },
  { value: 'EVENT', label: LL.value?.duels.gameMode.event() || 'イベント' },
  { value: 'DC', label: LL.value?.duels.gameMode.dc() || 'DC' },
]);

const minUsageOptions = [
  { value: 1, label: '1回以上' },
  { value: 3, label: '3回以上' },
  { value: 5, label: '5回以上' },
  { value: 10, label: '10回以上' },
  { value: 20, label: '20回以上' },
];

// Popular Decks
const loadingPopular = ref(true);
const popularDecksResponse = ref<PopularDecksResponse | null>(null);
const popularDecks = ref<DeckRanking[]>([]);

const popularDecksHeaders = [
  { title: '順位', key: 'rank', width: '80px' },
  { title: 'デッキ名', key: 'deck_name' },
  { title: '使用回数', key: 'usage_count', width: '100px' },
  { title: '勝率', key: 'win_rate', width: '100px' },
  { title: '勝敗', key: 'win_loss', width: '100px' },
];

// Deck Trends
const loadingTrends = ref(true);
const deckTrendsData = ref<DeckTrendEntry[]>([]);
const topDecks = ref<string[]>([]);
const trendsChartRef = ref<HTMLCanvasElement | null>(null);
let trendsChart: Chart | null = null;

// Game Mode Stats
const loadingGameMode = ref(true);
const gameModeStats = ref<GameModeStatDetail[]>([]);
const gameModeChartRef = ref<HTMLCanvasElement | null>(null);
let gameModeChart: Chart | null = null;

// Load functions
async function loadPopularDecks() {
  loadingPopular.value = true;
  try {
    const response = await getPopularDecks(
      selectedPeriod.value,
      selectedGameMode.value || undefined,
      minUsage.value,
      20,
    );
    popularDecksResponse.value = response;
    popularDecks.value = response.decks;
  } catch (e) {
    notificationStore.error('人気デッキの取得に失敗しました');
  } finally {
    loadingPopular.value = false;
  }
}

async function loadDeckTrends() {
  loadingTrends.value = true;
  try {
    const response = await getDeckTrends(
      selectedPeriod.value,
      selectedPeriod.value <= 14 ? 'daily' : 'weekly',
      selectedGameMode.value || undefined,
      5,
    );
    deckTrendsData.value = response.trends;
    topDecks.value = response.top_decks;
    await nextTick();
    renderTrendsChart();
  } catch (e) {
    notificationStore.error('デッキ推移の取得に失敗しました');
  } finally {
    loadingTrends.value = false;
  }
}

async function loadGameModeStats() {
  loadingGameMode.value = true;
  try {
    const response = await getGameModeStats(selectedPeriod.value);
    gameModeStats.value = response.stats;
    await nextTick();
    renderGameModeChart();
  } catch (e) {
    notificationStore.error('ゲームモード統計の取得に失敗しました');
  } finally {
    loadingGameMode.value = false;
  }
}

function loadData() {
  loadPopularDecks();
  loadDeckTrends();
  loadGameModeStats();
}

// Chart rendering
function renderTrendsChart() {
  if (!trendsChartRef.value || topDecks.value.length === 0) return;

  if (trendsChart) {
    trendsChart.destroy();
  }

  // Group data by date
  const dates = [...new Set(deckTrendsData.value.map((d) => d.date))].sort();
  const datasets = topDecks.value.map((deckName, index) => {
    const data = dates.map((date) => {
      const entry = deckTrendsData.value.find(
        (d) => d.date === date && d.deck_name === deckName,
      );
      return entry?.usage_rate ?? 0;
    });

    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(255, 205, 86)',
      'rgb(54, 162, 235)',
      'rgb(153, 102, 255)',
    ];

    return {
      label: deckName,
      data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.3,
      fill: false,
    };
  });

  trendsChart = new Chart(trendsChartRef.value, {
    type: 'line',
    data: {
      labels: dates,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(1)}%`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '使用率 (%)',
          },
        },
      },
    },
  });
}

function renderGameModeChart() {
  if (!gameModeChartRef.value || gameModeStats.value.length === 0) return;

  if (gameModeChart) {
    gameModeChart.destroy();
  }

  const colors = {
    RANK: 'rgb(255, 99, 132)',
    RATE: 'rgb(54, 162, 235)',
    EVENT: 'rgb(255, 205, 86)',
    DC: 'rgb(75, 192, 192)',
  };

  gameModeChart = new Chart(gameModeChartRef.value, {
    type: 'doughnut',
    data: {
      labels: gameModeStats.value.map((s) => s.game_mode),
      datasets: [
        {
          data: gameModeStats.value.map((s) => s.duel_count),
          backgroundColor: gameModeStats.value.map(
            (s) => colors[s.game_mode as keyof typeof colors] || 'rgb(128, 128, 128)',
          ),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const stat = gameModeStats.value[context.dataIndex];
              return `${stat.game_mode}: ${stat.duel_count}対戦 (${stat.percentage.toFixed(1)}%)`;
            },
          },
        },
      },
    },
  });
}

// Helper functions
function getRankColor(rank: number) {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'grey';
  if (rank === 3) return 'brown';
  return 'default';
}

function getWinRateClass(winRate: number) {
  if (winRate >= 60) return 'text-success font-weight-bold';
  if (winRate >= 50) return 'text-primary';
  return 'text-error';
}

function getGameModeColor(gameMode: string) {
  switch (gameMode) {
    case 'RANK':
      return 'red';
    case 'RATE':
      return 'blue';
    case 'EVENT':
      return 'amber';
    case 'DC':
      return 'teal';
    default:
      return 'grey';
  }
}

function getGameModeIcon(gameMode: string) {
  switch (gameMode) {
    case 'RANK':
      return 'mdi-trophy';
    case 'RATE':
      return 'mdi-chart-line';
    case 'EVENT':
      return 'mdi-calendar-star';
    case 'DC':
      return 'mdi-cards';
    default:
      return 'mdi-gamepad';
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.meta-analysis-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.trends-chart-container,
.game-mode-chart-container {
  position: relative;
  height: 300px;
}

.game-mode-chart-container {
  height: 250px;
}
</style>
