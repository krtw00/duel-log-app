<template>
  <div>
    <!-- 対戦履歴 -->
    <v-card class="duel-table-card">
      <v-card-title class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-icon class="mr-2" color="primary">mdi-table</v-icon>
          <span class="text-h6">{{ LL?.dashboard.history.title() }}</span>
        </div>
        <duel-actions-bar
          ref="actionsBarRef"
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
        :show-actions="true"
        @refresh="onRefresh"
        @edit="editDuel"
        @delete="deleteDuel"
      />
    </v-card>

    <!-- 対戦記録編集ダイアログ -->
    <duel-form-dialog
      v-model="dialogOpen"
      :duel="selectedDuel"
      :default-game-mode="defaultGameMode"
      :initial-my-decks="initialMyDecks"
      :initial-opponent-decks="initialOpponentDecks"
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
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

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
  (e: 'duel-saved', payload: { duel: Duel; upsertDecks: Deck[] }): void;
}>();

const shareDialogOpened = ref(false);
const actionsBarRef = ref<InstanceType<typeof DuelActionsBar> | null>(null);
const initialMyDecks = computed(() => props.decks.filter((deck) => !deck.is_opponent));
const initialOpponentDecks = computed(() => props.decks.filter((deck) => deck.is_opponent));

// CSV operations composable
const { handleFileUpload: handleFileUploadBase, exportCSV } = useCSVOperations({
  selectedYear: computed(() => props.year),
  selectedMonth: computed(() => props.month),
  currentMode: computed(() => props.gameMode),
  loading: computed(() => props.loading),
  fetchDuels: async () => emit('refresh'),
});

// ファイル選択ダイアログを開く
const triggerFileInput = () => {
  actionsBarRef.value?.fileInputRef?.click();
};

// ファイルアップロード処理（inputのクリア処理を追加）
const handleFileUpload = async (event: Event) => {
  await handleFileUploadBase(event);
  // 同じファイルを再度選択できるように、inputの値をクリア
  if (actionsBarRef.value?.fileInputRef) {
    actionsBarRef.value.fileInputRef.value = '';
  }
};

// Duel management composable
const { selectedDuel, dialogOpen, editDuel, deleteDuel } = useDuelManagement({
  duels: computed(() => props.duels),
  decks: computed(() => props.decks),
  fetchDuels: async () => emit('refresh'),
});

const handleSaved = (payload: { duel: Duel; upsertDecks: Deck[] }) => {
  emit('duel-saved', payload);
};

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
