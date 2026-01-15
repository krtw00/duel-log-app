<template>
  <v-row class="mb-4">
    <v-col cols="6" sm="3">
      <v-select
        :model-value="year"
        :items="years"
        :label="LL?.common.year()"
        variant="outlined"
        density="compact"
        hide-details
        @update:model-value="$emit('update:year', $event)"
      ></v-select>
    </v-col>
    <v-col cols="6" sm="3">
      <v-select
        :model-value="month"
        :items="months"
        :label="LL?.common.month()"
        variant="outlined"
        density="compact"
        hide-details
        @update:model-value="$emit('update:month', $event)"
      ></v-select>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  year: number;
  month: number;
  years: number[];
  months: number[];
}

defineProps<Props>();

defineEmits<{
  'update:year': [value: number];
  'update:month': [value: number];
}>();
</script>
