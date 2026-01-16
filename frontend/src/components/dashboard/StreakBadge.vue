<template>
  <v-chip
    v-if="streak !== 0"
    :color="streak > 0 ? 'success' : 'error'"
    variant="flat"
    class="streak-badge"
    size="small"
  >
    <v-icon start size="16">
      {{ streak > 0 ? 'mdi-fire' : 'mdi-snowflake' }}
    </v-icon>
    <span class="font-weight-bold">
      {{ streakText }}
    </span>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Duel } from '@/types';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  duels: Duel[];
}

const props = defineProps<Props>();

// 連勝/連敗を計算（正の値=連勝、負の値=連敗）
const streak = computed(() => {
  if (props.duels.length === 0) return 0;

  // 日付順でソート（新しい順）
  const sortedDuels = [...props.duels].sort((a, b) => {
    return new Date(b.played_date).getTime() - new Date(a.played_date).getTime();
  });

  const firstResult = sortedDuels[0].is_win;
  let count = 0;

  for (const duel of sortedDuels) {
    if (duel.is_win === firstResult) {
      count++;
    } else {
      break;
    }
  }

  // 連勝なら正、連敗なら負
  return firstResult ? count : -count;
});

const streakText = computed(() => {
  const absStreak = Math.abs(streak.value);
  if (streak.value > 0) {
    return LL.value?.dashboard.streak.winning({ count: absStreak }) ?? `${absStreak} Win Streak`;
  } else if (streak.value < 0) {
    return LL.value?.dashboard.streak.losing({ count: absStreak }) ?? `${absStreak} Loss Streak`;
  }
  return '';
});
</script>

<style scoped lang="scss">
.streak-badge {
  font-size: 12px;
  letter-spacing: 0.3px;
}
</style>
