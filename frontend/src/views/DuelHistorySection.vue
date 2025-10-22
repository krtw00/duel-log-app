<template>
  <div>
    <!-- 対戦履歴 -->
    <v-card class="duel-table-card">
      <v-card-title class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-icon class="mr-2" color="primary">mdi-table</v-icon>
          <span class="text-h6">対戦履歴</span>
        </div>
        <duel-actions-bar
          ref="actionsBarRef"
          @add-duel="openDuelDialog"
          @export-csv="exportCSV"
          @import-csv="triggerFileInput"
          @share-data="shareDialogOpened = true"
          @file-change="handleFileUpload"
        />
      </v-card-title>

      <v-divider />

      <duel-table
        :duels="duels"
        :loading="loading"
        @refresh="onRefresh"
        @edit="editDuel"
        @delete="deleteDuel"
      />
    </v-card>

    <!-- 対戦記録入力ダイアログ -->
    <duel-form-dialog
      v-model="dialogOpen"
      :duel="selectedDuel"
      :default-game-mode="defaultGameMode"
      @saved="handleSaved"
    />

    <!-- 共有リンク生成ダイアログ -->
    <share-stats-dialog
      v-model="shareDialogOpened"
      :initial-year="year"
      :initial-month="month"
      :initial-game-mode="gameMode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Duel, Deck, GameMode } from '@/types';

// Components
import DuelActionsBar from '@/components/dashboard/DuelActionsBar.vue';
import DuelTable from '@/components/duel/DuelTable.vue';
import DuelFormDialog from '@/components/duel/DuelFormDialog.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue';

// Composables
import { useCSVOperations } from '@/composables/useCSVOperations';
import { useDuelManagement } from '@/composables/useDuelManagement';

// Props
interface Props {
  duels: Duel[];
  decks: Deck[];
  loading: boolean;
  year: number;
  month: number;
  gameMode: GameMode;
  defaultGameMode: GameMode;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const shareDialogOpened = ref(false);

// CSV operations composable
const { triggerFileInput, handleFileUpload, exportCSV } = useCSVOperations({
  selectedYear: computed(() => props.year),
  selectedMonth: computed(() => props.month),
  currentMode: computed(() => props.gameMode),
  loading: computed(() => props.loading),
  fetchDuels: async () => emit('refresh'),
});

// Duel management composable
const { selectedDuel, dialogOpen, openDuelDialog, editDuel, deleteDuel, handleSaved } =
  useDuelManagement({
    duels: computed(() => props.duels),
    decks: computed(() => props.decks),
    fetchDuels: async () => emit('refresh'),
  });

const onRefresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.duel-table-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>