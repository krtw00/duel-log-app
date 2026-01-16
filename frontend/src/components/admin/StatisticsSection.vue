<template>
  <div class="statistics-section">
    <!-- 統計カード -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="stat-card" :loading="loading">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="primary" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h3 font-weight-bold">{{ stats?.users.total ?? '-' }}</div>
            <div class="text-subtitle-1 text-grey">{{ LL?.admin.statistics.totalUsers() }}</div>
            <v-chip
              v-if="stats?.users.new_this_month"
              color="success"
              size="small"
              class="mt-2"
            >
              +{{ stats.users.new_this_month }} {{ LL?.admin.statistics.thisMonth() }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="stat-card" :loading="loading">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="info" class="mb-2">mdi-cards</v-icon>
            <div class="text-h3 font-weight-bold">
              {{ stats ? stats.decks.active + stats.decks.archived : '-' }}
            </div>
            <div class="text-subtitle-1 text-grey">{{ LL?.admin.statistics.totalDecks() }}</div>
            <div class="text-caption mt-2">
              <span class="text-success">{{ stats?.decks.active ?? 0 }}</span> /
              <span class="text-grey">{{ stats?.decks.archived ?? 0 }}</span>
              ({{ LL?.admin.statistics.activeArchived() }})
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="stat-card" :loading="loading">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="warning" class="mb-2">mdi-sword-cross</v-icon>
            <div class="text-h3 font-weight-bold">{{ stats?.duels.total ?? '-' }}</div>
            <div class="text-subtitle-1 text-grey">{{ LL?.admin.statistics.totalDuels() }}</div>
            <v-chip
              v-if="stats?.duels.this_month"
              color="warning"
              size="small"
              class="mt-2"
            >
              {{ stats.duels.this_month }} {{ LL?.admin.statistics.thisMonth() }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- アクティブユーザー -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="stat-card" :loading="loading">
          <v-card-text class="text-center pa-6">
            <v-icon size="36" color="success" class="mb-2">mdi-account-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats?.users.active_this_month ?? '-' }}</div>
            <div class="text-subtitle-1 text-grey">
              {{ LL?.admin.statistics.activeUsersThisMonth() }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="stat-card" :loading="loading">
          <v-card-text class="pa-6">
            <div class="text-h6 mb-4">{{ LL?.admin.statistics.gameModeBreakdown() }}</div>
            <div v-if="stats" class="game-mode-stats">
              <div
                v-for="(count, mode) in stats.duels.by_game_mode"
                :key="mode"
                class="game-mode-item d-flex justify-space-between align-center mb-2"
              >
                <span class="text-body-1">{{ mode }}</span>
                <v-chip :color="getGameModeColor(mode)" size="small">
                  {{ count.toLocaleString() }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 対戦数推移グラフ -->
    <v-card class="mb-6" :loading="timelineLoading">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-chart-line</v-icon>
        {{ LL?.admin.statistics.duelsTimeline() }}
      </v-card-title>
      <v-card-text>
        <div class="timeline-chart">
          <canvas ref="duelsChartRef"></canvas>
        </div>
      </v-card-text>
    </v-card>

    <!-- ユーザー登録数推移 -->
    <v-card :loading="registrationsLoading">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-account-plus</v-icon>
        {{ LL?.admin.statistics.userRegistrations() }}
      </v-card-title>
      <v-card-text>
        <div class="registrations-chart">
          <canvas ref="registrationsChartRef"></canvas>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useLocale } from '@/composables/useLocale';
import {
  getStatisticsOverview,
  getDuelsTimeline,
  getUserRegistrations,
} from '@/services/adminApi';
import type {
  StatisticsOverviewResponse,
  DuelsTimelineResponse,
  UserRegistrationsResponse,
} from '@/types/admin';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Chart.js の登録
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const { LL } = useLocale();

// 状態
const loading = ref(false);
const timelineLoading = ref(false);
const registrationsLoading = ref(false);
const stats = ref<StatisticsOverviewResponse | null>(null);
const timeline = ref<DuelsTimelineResponse | null>(null);
const registrations = ref<UserRegistrationsResponse | null>(null);

// Chart refs
const duelsChartRef = ref<HTMLCanvasElement | null>(null);
const registrationsChartRef = ref<HTMLCanvasElement | null>(null);
let duelsChart: Chart | null = null;
let registrationsChart: Chart | null = null;

// ゲームモードの色
const getGameModeColor = (mode: string): string => {
  const colors: Record<string, string> = {
    RANK: 'blue',
    RATE: 'purple',
    EVENT: 'orange',
    DC: 'green',
  };
  return colors[mode] || 'grey';
};

// データ取得
const fetchStatistics = async () => {
  loading.value = true;
  try {
    stats.value = await getStatisticsOverview();
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTimeline = async () => {
  timelineLoading.value = true;
  try {
    timeline.value = await getDuelsTimeline('daily', 30);
    await nextTick();
    renderDuelsChart();
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
  } finally {
    timelineLoading.value = false;
  }
};

const fetchRegistrations = async () => {
  registrationsLoading.value = true;
  try {
    registrations.value = await getUserRegistrations(12);
    await nextTick();
    renderRegistrationsChart();
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
  } finally {
    registrationsLoading.value = false;
  }
};

// チャート描画
const renderDuelsChart = () => {
  if (!duelsChartRef.value || !timeline.value) return;

  if (duelsChart) {
    duelsChart.destroy();
  }

  const ctx = duelsChartRef.value.getContext('2d');
  if (!ctx) return;

  const labels = timeline.value.timeline.map((entry) => entry.date.slice(5)); // MM-DD
  const data = timeline.value.timeline.map((entry) => entry.count);

  duelsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: LL.value?.admin.statistics.duelsCount() ?? 'Duels',
          data,
          borderColor: 'rgb(255, 167, 38)',
          backgroundColor: 'rgba(255, 167, 38, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

const renderRegistrationsChart = () => {
  if (!registrationsChartRef.value || !registrations.value) return;

  if (registrationsChart) {
    registrationsChart.destroy();
  }

  const ctx = registrationsChartRef.value.getContext('2d');
  if (!ctx) return;

  const labels = registrations.value.registrations.map((entry) => entry.month);
  const data = registrations.value.registrations.map((entry) => entry.count);

  registrationsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: LL.value?.admin.statistics.newUsers() ?? 'New Users',
          data,
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgb(33, 150, 243)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

// 初期化
onMounted(() => {
  fetchStatistics();
  fetchTimeline();
  fetchRegistrations();
});
</script>

<style scoped>
.stat-card {
  border-radius: 12px !important;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.timeline-chart,
.registrations-chart {
  height: 300px;
}

.game-mode-item {
  padding: 4px 0;
}
</style>
