<template>
  <div>
    <!-- ゲームモード切り替えタブ -->
    <game-mode-tab-bar
      :model-value="gameMode"
      :rank-count="rankCount"
      :rate-count="rateCount"
      :event-count="eventCount"
      :dc-count="dcCount"
      @update:model-value="onUpdateGameMode"
    />

    <!-- 年月フィルター -->
    <date-filter-bar
      :year="year"
      :month="month"
      :years="years"
      :months="months"
      @update:year="onUpdateYear"
      @update:month="onUpdateMonth"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GameModeTabBar from '@/components/dashboard/GameModeTabBar.vue';
import DateFilterBar from '@/components/dashboard/DateFilterBar.vue';
import type { GameMode } from '@/types';

interface Props {
  gameMode: GameMode;
  year: number;
  month: number;
  rankCount: number;
  rateCount: number;
  eventCount: number;
  dcCount: number;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:gameMode', value: GameMode): void;
  (e: 'update:year', value: number): void;
  (e: 'update:month', value: number): void;
}>();

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const months = Array.from({ length: 12 }, (_, i) => i + 1);

const onUpdateGameMode = (value: GameMode) => {
  emit('update:gameMode', value);
};

const onUpdateYear = (value: number) => {
  emit('update:year', value);
};

const onUpdateMonth = (value: number) => {
  emit('update:month', value);
};
</script>
