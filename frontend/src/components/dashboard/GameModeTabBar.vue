<template>
  <v-card class="mode-tab-card mb-4">
    <v-tabs
      :model-value="modelValue"
      color="primary"
      align-tabs="center"
      show-arrows
      class="mode-tabs"
      @update:model-value="(value) => $emit('update:modelValue', value as GameMode)"
    >
      <v-tab value="RANK" class="custom-tab">
        <v-icon :start="$vuetify.display.smAndUp">mdi-crown</v-icon>
        <span class="d-none d-sm-inline">{{ LL?.duels.gameMode.rank() }}</span>
        <v-chip class="ml-1 ml-sm-2" size="small" color="primary">
          {{ rankCount }}
        </v-chip>
      </v-tab>
      <v-tab value="RATE" class="custom-tab">
        <v-icon :start="$vuetify.display.smAndUp">mdi-chart-line</v-icon>
        <span class="d-none d-sm-inline">{{ LL?.duels.gameMode.rate() }}</span>
        <v-chip class="ml-1 ml-sm-2" size="small" color="info">
          {{ rateCount }}
        </v-chip>
      </v-tab>
      <v-tab value="EVENT" class="custom-tab">
        <v-icon :start="$vuetify.display.smAndUp">mdi-calendar-star</v-icon>
        <span class="d-none d-sm-inline">{{ LL?.duels.gameMode.event() }}</span>
        <v-chip class="ml-1 ml-sm-2" size="small" color="secondary">
          {{ eventCount }}
        </v-chip>
      </v-tab>
      <v-tab value="DC" class="custom-tab">
        <v-icon :start="$vuetify.display.smAndUp">mdi-trophy-variant</v-icon>
        <span class="d-none d-sm-inline">{{ LL?.duels.gameMode.dc() }}</span>
        <v-chip class="ml-1 ml-sm-2" size="small" color="warning">
          {{ dcCount }}
        </v-chip>
      </v-tab>
    </v-tabs>
  </v-card>
</template>

<script setup lang="ts">
import type { GameMode } from '@/types';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  modelValue: GameMode;
  rankCount: number;
  rateCount: number;
  eventCount: number;
  dcCount: number;
}

defineProps<Props>();

defineEmits<{
  'update:modelValue': [value: GameMode];
}>();
</script>

<style scoped>
.mode-tab-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.mode-tabs {
  background-color: transparent;
}

.custom-tab {
  text-transform: none;
  font-weight: 500;
}
</style>
