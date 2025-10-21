<template>
  <v-row class="mb-4">
    <v-col cols="6" sm="3">
      <v-select
        :model-value="year"
        :items="years"
        label="年"
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
        label="月"
        variant="outlined"
        density="compact"
        hide-details
        @update:model-value="$emit('update:month', $event)"
      ></v-select>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
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
