<template>
  <div>
    <!-- 統計カード -->
    <v-row class="mb-4">
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="総試合数"
          :value="overallStats?.total_duels ?? 0"
          icon="mdi-sword-cross"
          color="primary"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="勝率"
          :value="`${(overallStats?.win_rate ?? 0).toFixed(1)}%`"
          icon="mdi-trophy"
          color="success"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="先攻勝率"
          :value="`${(overallStats?.first_turn_win_rate ?? 0).toFixed(1)}%`"
          icon="mdi-lightning-bolt"
          color="warning"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="後攻勝率"
          :value="`${(overallStats?.second_turn_win_rate ?? 0).toFixed(1)}%`"
          icon="mdi-shield"
          color="secondary"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="コイン勝率"
          :value="`${(overallStats?.coin_win_rate ?? 0).toFixed(1)}%`"
          icon="mdi-poker-chip"
          color="yellow"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" lg="2">
        <stat-card
          title="先攻率"
          :value="`${(overallStats?.go_first_rate ?? 0).toFixed(1)}%`"
          icon="mdi-arrow-up-bold-hexagon-outline"
          color="teal"
        />
      </v-col>
    </v-row>

    <!-- 対戦履歴 -->
    <v-card v-if="duels && duels.length > 0" class="duel-card mt-4">
      <v-card-title class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-icon class="mr-2" color="primary">mdi-table</v-icon>
          <span class="text-h6">対戦履歴</span>
        </div>
      </v-card-title>
      <v-divider />
      <duel-table :duels="duels" :loading="loading" :show-actions="!isShared" />
    </v-card>
    <div v-else class="no-data-placeholder py-8">
      <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
      <p class="text-body-1 text-grey mt-4">対戦履歴がありません</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatCard from '@/components/duel/StatCard.vue';
import DuelTable from '@/components/duel/DuelTable.vue';

interface OverallStats {
  total_duels?: number;
  win_rate?: number;
  first_turn_win_rate?: number;
  second_turn_win_rate?: number;
  coin_win_rate?: number;
  go_first_rate?: number;
}

interface Props {
  overallStats?: OverallStats;
  duels?: any[];
  loading?: boolean;
  isShared?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  isShared: false,
});
</script>

<style scoped>
.duel-card {
  width: 100%;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
