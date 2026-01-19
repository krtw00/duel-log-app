<template>
  <div>
    <!-- 統計フィルターパネル -->
    <statistics-filter
      v-model:period-type="filterPeriodType"
      v-model:range-start="filterRangeStart"
      v-model:range-end="filterRangeEnd"
      v-model:my-deck-id="filterMyDeckId"
      :available-my-decks="availableMyDecks"
      @update:period-type="applyFilters"
      @update:range-start="applyFilters"
      @update:range-end="applyFilters"
      @update:my-deck-id="handleMyDeckFilterChange"
      @reset="resetFilters"
    />

    <!-- 統計カード -->
    <stats-display-cards :stats="currentStats" :coin-win-rate-color="coinWinRateColor" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Duel, Deck, GameMode } from '@/types';

// Components
import StatisticsFilter from '@/components/statistics/StatisticsFilter.vue';
import StatsDisplayCards from '@/components/dashboard/StatsDisplayCards.vue';

// Stores
import { useThemeStore } from '@/stores/theme';

// Composables
import { useDashboardFilters } from '@/composables/useDashboardFilters';
import { useStatsCalculation } from '@/composables/useStatsCalculation';

// Props
interface Props {
  duels: Duel[];
  decks: Deck[];
  currentMode: GameMode;
}
const props = defineProps<Props>();

// Stores
const themeStore = useThemeStore();

// ゲームモード別にデュエルをフィルタリング
const rankDuels = computed(() => props.duels.filter((d) => d.game_mode === 'RANK'));
const rateDuels = computed(() => props.duels.filter((d) => d.game_mode === 'RATE'));
const eventDuels = computed(() => props.duels.filter((d) => d.game_mode === 'EVENT'));
const dcDuels = computed(() => props.duels.filter((d) => d.game_mode === 'DC'));

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
  updateAvailableDecks,
  resetFilters,
} = useDashboardFilters({
  currentMode: computed(() => props.currentMode),
  rankDuels,
  rateDuels,
  eventDuels,
  dcDuels,
  decks: computed(() => props.decks),
});

// Stats calculation composable
const { rankStats, currentStats, recalculateAllStats } = useStatsCalculation({
  currentMode: computed(() => props.currentMode),
  filteredRankDuels,
  filteredRateDuels,
  filteredEventDuels,
  filteredDcDuels,
});

// Computed
const coinWinRateColor = computed(() => {
  return themeStore.isDark ? 'yellow' : 'black';
});

// Methods
const applyFilters = () => {
  updateAvailableDecks();
  recalculateAllStats();
};

const handleMyDeckFilterChange = () => {
  applyFilters();
};

// Watchers
watch(
  () => props.duels,
  () => {
    applyFilters();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.currentMode,
  () => {
    applyFilters();
  },
);

// Expose for testing
defineExpose({
  rankStats,
  availableMyDecks,
  filterMyDeckId,
});
</script>
