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
        <!-- ゲームモード切り替えタブ -->
        <game-mode-tab-bar
          v-model="currentMode"
          :rank-count="rankDuels.length"
          :rate-count="rateDuels.length"
          :event-count="eventDuels.length"
          :dc-count="dcDuels.length"
        />

        <!-- 年月フィルター -->
        <date-filter-bar
          v-model:year="selectedYear"
          v-model:month="selectedMonth"
          :years="years"
          :months="months"
          @update:year="fetchDuels"
          @update:month="fetchDuels"
        />

        <!-- 統計フィルターパネル -->
        <filter-panel
          v-model:period-type="filterPeriodType"
          v-model:range-start="filterRangeStart"
          v-model:range-end="filterRangeEnd"
          v-model:my-deck-id="filterMyDeckId"
          :available-decks="availableMyDecks"
          :period-options="filterPeriodOptions"
          @update:period-type="applyFilters"
          @update:range-start="applyFilters"
          @update:range-end="applyFilters"
          @update:my-deck-id="handleMyDeckFilterChange"
          @reset-filters="resetFilters"
        />

        <!-- 統計カード -->
        <stats-display-cards :stats="currentStats" :coin-win-rate-color="coinWinRateColor" />

        <!-- OBS連携カード -->
        <OBSInfoCard
          :streamer-mode-enabled="authStore.isStreamerModeEnabled"
          :coin-win-rate-color="coinWinRateColor"
          @open-settings="showOBSDialog = true"
        />

        <!-- 対戦履歴 -->
        <v-card class="duel-table-card">
          <v-card-title class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="primary">mdi-table</v-icon>
              <span class="text-h6">対戦履歴</span>
            </div>
            <duel-actions-bar
              ref="actionsBarRef"
              @add-duel="openDuelDialog"
              @export-csv="exportCSV"
              @import-csv="triggerFileInput"
              @share-data="shareDialogOpened = true"
              @file-change="handleFileUpload"
            />
          </v-card-title>

          <v-divider />

          <duel-table
            :duels="currentDuels"
            :loading="loading"
            @refresh="fetchDuels"
            @edit="editDuel"
            @delete="deleteDuel"
          />
        </v-card>
      </v-container>
    </v-main>

    <!-- 対戦記録入力ダイアログ -->
    <duel-form-dialog
      v-model="dialogOpen"
      :duel="selectedDuel"
      :default-game-mode="currentMode"
      @saved="handleSaved"
    />

    <!-- 共有リンク生成ダイアログ -->
    <share-stats-dialog
      v-model="shareDialogOpened"
      :initial-year="selectedYear"
      :initial-month="selectedMonth"
      :initial-game-mode="currentMode"
    />

    <!-- OBS連携モーダル -->
    <OBSConfigPanel
      v-model="showOBSDialog"
      v-model:period-type="obsPeriodType"
      v-model:year="obsYear"
      v-model:month="obsMonth"
      v-model:limit="obsLimit"
      v-model:game-mode="obsGameMode"
      v-model:layout="obsLayout"
      v-model:refresh-interval="obsRefreshInterval"
      :display-items="displayItems"
      :dragged-index="draggedIndex"
      :obs-url="obsUrl"
      :url-copied="urlCopied"
      :years="years"
      :months="months"
      :period-type-options="periodTypeOptions"
      :game-mode-options="gameModeOptions"
      :layout-options="layoutOptions"
      :recommended-size-text="recommendedSizeText"
      @drag-start="handleDragStart"
      @drag-over="handleDragOver"
      @drag-enter="handleDragEnter"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
      @drag-end="handleDragEnd"
      @copy-url="copyOBSUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import type { Duel, Deck, GameMode } from '@/types';

// Components
import AppBar from '@/components/layout/AppBar.vue';
import GameModeTabBar from '@/components/dashboard/GameModeTabBar.vue';
import DateFilterBar from '@/components/dashboard/DateFilterBar.vue';
import FilterPanel from '@/components/dashboard/FilterPanel.vue';
import StatsDisplayCards from '@/components/dashboard/StatsDisplayCards.vue';
import OBSInfoCard from '@/components/dashboard/OBSInfoCard.vue';
import DuelActionsBar from '@/components/dashboard/DuelActionsBar.vue';
import OBSConfigPanel from '@/components/dashboard/OBSConfigPanel.vue';
import DuelTable from '@/components/duel/DuelTable.vue';
import DuelFormDialog from '@/components/duel/DuelFormDialog.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue';

// Stores
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

// Composables
import { useDashboardFilters } from '@/composables/useDashboardFilters';
import { useStatsCalculation } from '@/composables/useStatsCalculation';
import { useCSVOperations } from '@/composables/useCSVOperations';
import { useDuelManagement } from '@/composables/useDuelManagement';
import { useOBSConfiguration } from '@/composables/useOBSConfiguration';

// Navigation
const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

// Stores
const authStore = useAuthStore();
const themeStore = useThemeStore();

// Shared state
const duels = ref<Duel[]>([]);
const decks = ref<Deck[]>([]);
const loading = ref(false);
const currentMode = ref<GameMode>('RANK');
const shareDialogOpened = ref(false);

// 年月選択
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});
const months = Array.from({ length: 12 }, (_, i) => i + 1);

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

// Dashboard filters composable
const {
  filterPeriodType,
  filterRangeStart,
  filterRangeEnd,
  filterMyDeckId,
  availableMyDecks,
  filteredRankDuels,
  filteredRateDuels,
  filteredEventDuels,
  filteredDcDuels,
  filterPeriodOptions,
  updateAvailableDecks,
  resetFilters,
} = useDashboardFilters({
  currentMode,
  rankDuels,
  rateDuels,
  eventDuels,
  dcDuels,
  decks,
});

// Stats calculation composable
const { rankStats, currentStats, recalculateAllStats } = useStatsCalculation({
  currentMode,
  filteredRankDuels,
  filteredRateDuels,
  filteredEventDuels,
  filteredDcDuels,
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

    duels.value = duelsResponse.data;
    decks.value = decksResponse.data;

    applyFilters();
  } catch (error) {
    console.error('Failed to fetch duels:', error);
  } finally {
    loading.value = false;
  }
};

// CSV operations composable
const { triggerFileInput, handleFileUpload, exportCSV } = useCSVOperations({
  selectedYear,
  selectedMonth,
  currentMode,
  loading,
  fetchDuels,
});

// Duel management composable
const { selectedDuel, dialogOpen, openDuelDialog, editDuel, deleteDuel, handleSaved } =
  useDuelManagement({
    duels,
    decks,
    fetchDuels,
  });

const {
  showOBSDialog,
  obsPeriodType,
  obsYear,
  obsMonth,
  obsLimit,
  obsGameMode,
  obsLayout,
  obsRefreshInterval,
  displayItems,
  draggedIndex,
  urlCopied,
  periodTypeOptions,
  gameModeOptions,
  layoutOptions,
  recommendedSizeText,
  obsUrl,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  copyOBSUrl,
} = useOBSConfiguration();

// Computed
const coinWinRateColor = computed(() => {
  return themeStore.isDark ? 'yellow' : 'black';
});

// Actions Bar Reference
const actionsBarRef = ref<InstanceType<typeof DuelActionsBar> | null>(null);

// Apply filters
const applyFilters = () => {
  updateAvailableDecks();
  recalculateAllStats();
};

const handleMyDeckFilterChange = () => {
  applyFilters();
};

const handleModeChange = (mode: GameMode) => {
  currentMode.value = mode;
};

// Watchers
watch(currentMode, () => {
  applyFilters();
});

// Lifecycle
onMounted(() => {
  fetchDuels();
});

// Expose for testing
defineExpose({
  shareDialogOpened,
  rankStats,
  availableMyDecks,
  filterMyDeckId,
  handleMyDeckFilterChange,
  handleModeChange,
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
