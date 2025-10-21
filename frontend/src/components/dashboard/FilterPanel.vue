<template>
  <v-card class="filter-card mb-4">
    <v-card-title class="pa-4">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-filter</v-icon>
        <span class="text-h6">統計フィルター</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-4">
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            :model-value="periodType"
            :items="periodOptions"
            label="期間"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="$emit('update:periodType', $event)"
          ></v-select>
        </v-col>
        <v-col v-if="periodType === 'range'" cols="6" sm="3" md="2">
          <v-text-field
            :model-value="rangeStart"
            label="開始（試合目）"
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
            label="終了（試合目）"
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
            :items="availableDecks"
            item-title="name"
            item-value="id"
            label="自分のデッキ"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="availableDecks.length === 0"
            @update:model-value="$emit('update:myDeckId', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="2" class="d-flex align-center">
          <v-btn color="secondary" variant="outlined" block @click="$emit('reset-filters')">
            <v-icon start>mdi-refresh</v-icon>
            リセット
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface DeckOption {
  id: number;
  name: string;
}

interface Props {
  periodType: 'all' | 'range';
  rangeStart: number;
  rangeEnd: number;
  myDeckId: number | null;
  availableDecks: DeckOption[];
  periodOptions: Array<{ title: string; value: string }>;
}

defineProps<Props>();

defineEmits<{
  'update:periodType': [value: 'all' | 'range'];
  'update:rangeStart': [value: number];
  'update:rangeEnd': [value: number];
  'update:myDeckId': [value: number | null];
  'reset-filters': [];
}>();
</script>

<style scoped>
.filter-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
