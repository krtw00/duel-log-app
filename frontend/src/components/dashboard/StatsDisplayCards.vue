<template>
  <v-row class="mb-4">
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.statistics.overview.totalMatches() || ''"
        :value="stats.total_duels"
        icon="mdi-sword-cross"
        color="primary"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.winRate() || ''"
        :value="`${(stats.win_rate * 100).toFixed(1)}%`"
        icon="mdi-trophy"
        color="success"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.firstWinRate() || ''"
        :value="`${(stats.first_turn_win_rate * 100).toFixed(1)}%`"
        icon="mdi-lightning-bolt"
        color="warning"
      />
    </v-col>
    <v-col cols="6" sm="4" md="2">
      <stat-card
        :title="LL?.dashboard.streamer.secondWinRate() || ''"
        :value="`${(stats.second_turn_win_rate * 100).toFixed(1)}%`"
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
import StatCard from '@/components/duel/StatCard.vue';
import type { DuelStats } from '@/types';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  stats: DuelStats;
  coinWinRateColor: string;
}

defineProps<Props>();
</script>
