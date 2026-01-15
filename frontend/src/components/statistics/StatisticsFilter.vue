<template>
  <v-card class="filter-card mb-4">
    <v-card-title class="pa-4">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-filter</v-icon>
        <span class="text-h6">{{ LL?.statistics.filter.title() }}</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-4">
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            :model-value="periodType"
            :items="periodOptions"
            :label="LL?.statistics.filter.period()"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="$emit('update:periodType', $event)"
          ></v-select>
        </v-col>
        <v-col v-if="periodType === 'range'" cols="6" sm="3" md="2">
          <v-text-field
            :model-value="rangeStart"
            :label="LL?.statistics.filter.rangeStart()"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            min="1"
            @update:model-value="$emit('update:rangeStart', Number($event))"
          ></v-text-field>
        </v-col>
        <v-col v-if="periodType === 'range'" cols="6" sm="3" md="2">
          <v-text-field
            :model-value="rangeEnd"
            :label="LL?.statistics.filter.rangeEnd()"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            min="1"
            @update:model-value="$emit('update:rangeEnd', Number($event))"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select
            :model-value="myDeckId"
            :items="availableMyDecks"
            item-title="name"
            item-value="id"
            :label="LL?.statistics.filter.myDeck()"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="availableMyDecks.length === 0"
            @update:model-value="$emit('update:myDeckId', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="2" class="d-flex align-center">
          <v-btn color="secondary" variant="outlined" block @click="$emit('reset')">
            <v-icon start>mdi-refresh</v-icon>
            {{ LL?.common.reset() }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Deck {
  id: number;
  name: string;
}

interface Props {
  periodType: 'all' | 'range';
  rangeStart: number;
  rangeEnd: number;
  myDeckId: number | null;
  availableMyDecks: Deck[];
}

defineProps<Props>();

defineEmits<{
  'update:periodType': [value: 'all' | 'range'];
  'update:rangeStart': [value: number];
  'update:rangeEnd': [value: number];
  'update:myDeckId': [value: number | null];
  reset: [];
}>();

const periodOptions = computed(() => [
  { title: LL.value?.statistics.filter.periodAll() || '', value: 'all' },
  { title: LL.value?.statistics.filter.periodRange() || '', value: 'range' },
]);
</script>

<style scoped>
.filter-card {
  width: 100%;
}
</style>
