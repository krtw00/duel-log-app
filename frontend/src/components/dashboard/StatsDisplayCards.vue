<template>
  <v-row class="mb-4">
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.statistics.overview.totalMatches() || ''"
        :value="stats.total_duels"
        :subtitle="winsLossesLabel"
        icon="mdi-sword-cross"
        color="primary"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.winRate() || ''"
        :value="`${(stats.win_rate * 100).toFixed(1)}%`"
        :subtitle="`${stats.win_count}${LL?.duels.result.win() || 'W'} / ${stats.lose_count}${LL?.duels.result.lose() || 'L'}`"
        icon="mdi-trophy"
        color="success"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.firstWinRate() || ''"
        :value="`${(stats.first_turn_win_rate * 100).toFixed(1)}%`"
        :subtitle="firstTurnLabel"
        icon="mdi-lightning-bolt"
        color="warning"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.secondWinRate() || ''"
        :value="`${(stats.second_turn_win_rate * 100).toFixed(1)}%`"
        :subtitle="secondTurnLabel"
        icon="mdi-shield"
        color="secondary"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.coinWinRate() || ''"
        :value="`${(stats.coin_win_rate * 100).toFixed(1)}%`"
        icon="mdi-poker-chip"
        :color="coinWinRateColor"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.firstRate() || ''"
        :value="`${(stats.go_first_rate * 100).toFixed(1)}%`"
        icon="mdi-arrow-up-bold-hexagon-outline"
        color="teal"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatCard from '@/components/duel/StatCard.vue';
import type { DuelStats } from '@/types';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  stats: DuelStats;
  coinWinRateColor: string;
}

const props = defineProps<Props>();

// 勝敗ラベル
const winsLossesLabel = computed(() => {
  const wins = props.stats.win_count || 0;
  const losses = props.stats.lose_count || 0;
  return `${wins}W / ${losses}L`;
});

// 先攻時のラベル（先攻試合数を計算）
const firstTurnLabel = computed(() => {
  const total = props.stats.total_duels || 0;
  const goFirstRate = props.stats.go_first_rate || 0;
  const firstGames = Math.round(total * goFirstRate);
  const firstWinRate = props.stats.first_turn_win_rate || 0;
  const firstWins = Math.round(firstGames * firstWinRate);
  if (firstGames === 0) return '';
  return `${firstWins}/${firstGames}`;
});

// 後攻時のラベル（後攻試合数を計算）
const secondTurnLabel = computed(() => {
  const total = props.stats.total_duels || 0;
  const goFirstRate = props.stats.go_first_rate || 0;
  const secondGames = Math.round(total * (1 - goFirstRate));
  const secondWinRate = props.stats.second_turn_win_rate || 0;
  const secondWins = Math.round(secondGames * secondWinRate);
  if (secondGames === 0) return '';
  return `${secondWins}/${secondGames}`;
});
</script>
