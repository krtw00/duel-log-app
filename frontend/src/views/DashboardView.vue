<template>
  <div>
    <!-- ナビゲーションバー -->
    <app-bar current-view="dashboard" @toggle-drawer="drawer = !drawer" />

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
      <v-container fluid class="pa-6 pa-sm-6 pa-xs-3">
        <DashboardHeader
          v-model:game-mode="currentMode"
          v-model:year="selectedYear"
          v-model:month="selectedMonth"
          :rank-count="rankDuels.length"
          :rate-count="rateDuels.length"
          :event-count="eventDuels.length"
          :dc-count="dcDuels.length"
          @update:year="fetchDuels"
          @update:month="fetchDuels"
        />

        <StatisticsSection :duels="duels" :decks="decks" :current-mode="currentMode" />

        <OBSSection />

        <DuelHistorySection
          :duels="currentDuels"
          :decks="decks"
          :loading="loading"
          :year="selectedYear"
          :month="selectedMonth"
          :game-mode="currentMode"
          :default-game-mode="currentMode"
          @refresh="fetchDuels"
        />
      </v-container>
    </v-main>

    <!-- 共有リンク生成ダイアログ -->
    <share-stats-dialog
      v-model="shareDialogOpened"
      :initial-year="selectedYear"
      :initial-month="selectedMonth"
      :initial-game-mode="currentMode"
    />


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/api';
import type { Duel, Deck, GameMode } from '@/types';

// Components
import AppBar from '@/components/layout/AppBar.vue';
import DashboardHeader from './DashboardHeader.vue';
import StatisticsSection from './StatisticsSection.vue';
import OBSSection from './OBSSection.vue';
import DuelHistorySection from './DuelHistorySection.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue';

// Navigation
const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

// Shared state
const duels = ref<Duel[]>([]);
const decks = ref<Deck[]>([]);
const loading = ref(false);
const currentMode = ref<GameMode>('RANK');
const shareDialogOpened = ref(false);

// 年月選択
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);


// ゲームモード別にデュエルをフィルタリング
const rankDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RANK'));
const rateDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RATE'));
const eventDuels = computed(() => duels.value.filter((d) => d.game_mode === 'EVENT'));
const dcDuels = computed(() => duels.value.filter((d) => d.game_mode === 'DC'));

const currentDuels = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankDuels.value;
    case 'RATE':
      return rateDuels.value;
    case 'EVENT':
      return eventDuels.value;
    case 'DC':
      return dcDuels.value;
    default:
      return [];
  }
});



// Data fetching - declare before using in composables
const fetchDuels = async () => {
  loading.value = true;
  try {
    const [duelsResponse, decksResponse] = await Promise.all([
      api.get('/duels/', {
        params: {
          year: selectedYear.value,
          month: selectedMonth.value,
        },
      }),
      api.get('/decks/'),
    ]);

    decks.value = decksResponse.data;
    duels.value = duelsResponse.data;
  } catch (error) {
    console.error('Failed to fetch duels:', error);
  } finally {
    loading.value = false;
  }
};





// Lifecycle
onMounted(() => {
  fetchDuels();
});

// Expose for testing
defineExpose({
  shareDialogOpened,
});
</script>

<style scoped>
.main-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.duel-table-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
