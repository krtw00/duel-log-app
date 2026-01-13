<template>
  <app-layout current-view="dashboard" main-class="dashboard-main">
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

      <DuelEntrySection
        :decks="decks"
        :default-game-mode="currentMode"
        :default-first-or-second="defaultFirstOrSecond"
        @update:default-first-or-second="defaultFirstOrSecond = $event"
        @duel-saved="handleDuelSaved"
      />

      <DuelHistorySection
        :duels="currentDuels"
        :decks="decks"
        :loading="loading"
        :year="selectedYear"
        :month="selectedMonth"
        :game-mode="currentMode"
        :default-game-mode="currentMode"
        @refresh="fetchDuels"
        @duel-saved="handleDuelSaved"
      />

      <StreamerSection :streamer-mode-enabled="authStore.isStreamerModeEnabled" />
    </v-container>

    <template #overlay>
      <share-stats-dialog
        v-model="shareDialogOpened"
        :initial-year="selectedYear"
        :initial-month="selectedMonth"
        :initial-game-mode="currentMode"
      />
    </template>
  </app-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import { createLogger } from '@/utils/logger';
import type { Duel, Deck, GameMode } from '@/types';
import { useUiStore } from '@/stores/ui';

const logger = createLogger('Dashboard');

// Components
import AppLayout from '@/components/layout/AppLayout.vue';
import DashboardHeader from './DashboardHeader.vue';
import StatisticsSection from './StatisticsSection.vue';
import DuelEntrySection from './DuelEntrySection.vue';
import StreamerSection from '@/components/dashboard/StreamerSection.vue';
import { useAuthStore } from '@/stores/auth';
import DuelHistorySection from './DuelHistorySection.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue';

// Shared state
const duels = ref<Duel[]>([]);
const decks = ref<Deck[]>([]);
const loading = ref(false);
const currentMode = ref<GameMode>('RANK');
const shareDialogOpened = ref(false);
const uiStore = useUiStore();
const authStore = useAuthStore();
const DEFAULT_FIRST_OR_SECOND_STORAGE_KEY = 'duellog.defaultFirstOrSecond';
const LEGACY_DEFAULT_COIN_STORAGE_KEY = 'duellog.defaultCoin';
const defaultFirstOrSecond = ref<0 | 1>(1);

// 年月選択
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

const loadDefaultFirstOrSecond = () => {
  try {
    const stored = window.localStorage.getItem(DEFAULT_FIRST_OR_SECOND_STORAGE_KEY);
    if (stored === '0' || stored === '1') {
      defaultFirstOrSecond.value = stored === '0' ? 0 : 1;
      return;
    }

    const legacyStored = window.localStorage.getItem(LEGACY_DEFAULT_COIN_STORAGE_KEY);
    if (legacyStored === '0' || legacyStored === '1') {
      defaultFirstOrSecond.value = legacyStored === '0' ? 0 : 1;
      return;
    }

    defaultFirstOrSecond.value = 1;
  } catch {
    defaultFirstOrSecond.value = 1;
  }
};

loadDefaultFirstOrSecond();

watch(defaultFirstOrSecond, (value) => {
  try {
    window.localStorage.setItem(DEFAULT_FIRST_OR_SECOND_STORAGE_KEY, String(value));
  } catch {
    // ignore storage errors (private mode etc.)
  }
});

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

const upsertDeck = (deck: Deck) => {
  if (!deck?.id) return;
  const existingIndex = decks.value.findIndex((d) => d.id === deck.id);
  if (existingIndex >= 0) {
    decks.value[existingIndex] = { ...decks.value[existingIndex], ...deck };
  } else {
    decks.value.unshift(deck);
  }
};

const upsertDuel = (duel: Duel) => {
  const existingIndex = duels.value.findIndex((d) => d.id === duel.id);
  if (existingIndex >= 0) {
    const previous = duels.value[existingIndex];
    duels.value[existingIndex] = {
      ...previous,
      ...duel,
      deck: duel.deck ?? previous.deck,
      opponent_deck: duel.opponent_deck ?? previous.opponent_deck,
    };
  } else {
    duels.value.unshift(duel);
  }

  duels.value.sort((a, b) => {
    const aTime = Date.parse(a.played_date ?? '');
    const bTime = Date.parse(b.played_date ?? '');
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
    return bTime - aTime;
  });
};

const handleDuelSaved = (payload: { duel: Duel; upsertDecks: Deck[] }) => {
  payload.upsertDecks.forEach(upsertDeck);
  upsertDuel(payload.duel);
};

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
    logger.error('Failed to fetch duels');
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchDuels();
});

watch(
  currentMode,
  (mode) => {
    uiStore.setLastGameMode(mode);
  },
  { immediate: true },
);

// Expose for testing
defineExpose({
  shareDialogOpened,
});
</script>

<style scoped>
:deep(.dashboard-main) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.duel-table-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
