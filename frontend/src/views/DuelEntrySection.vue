<template>
  <div class="duel-entry-section">
    <v-card class="entry-toolbar">
      <v-card-title class="pa-4 entry-toolbar__title">
        <v-icon class="mr-2" color="primary">mdi-tune-variant</v-icon>
        <span class="text-subtitle-1">{{ LL?.dashboard.duelEntry.defaultSettings() }}</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <div class="default-toggle d-flex align-center ga-2">
          <v-tooltip
            :text="LL?.dashboard.duelEntry.defaultTurnTooltip()"
            location="top"
            content-class="default-turn-tooltip"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-information-outline"
                variant="text"
                density="compact"
                class="default-toggle__icon"
              />
            </template>
          </v-tooltip>
          <v-btn-toggle
            v-model="defaultFirstOrSecondProxy"
            mandatory
            divided
            density="compact"
            variant="outlined"
            color="primary"
            selected-class="default-toggle__selected"
            class="default-toggle__toggle"
          >
            <v-btn :value="0" size="small">{{ LL?.duels.turnOrder.second() }}</v-btn>
            <v-btn :value="1" size="small">{{ LL?.duels.turnOrder.first() }}</v-btn>
          </v-btn-toggle>
        </div>
      </v-card-text>
    </v-card>

    <DuelFormDialog
      inline
      :model-value="true"
      :duel="null"
      :default-game-mode="defaultGameMode"
      :default-first-or-second="defaultFirstOrSecond"
      :initial-my-decks="initialMyDecks"
      :initial-opponent-decks="initialOpponentDecks"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Deck, Duel, GameMode } from '@/types';
import DuelFormDialog from '@/components/duel/DuelFormDialog.vue';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  decks: Deck[];
  defaultGameMode: GameMode;
  defaultFirstOrSecond: 0 | 1;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'duel-saved', payload: { duel: Duel; upsertDecks: Deck[] }): void;
  (e: 'update:defaultFirstOrSecond', value: 0 | 1): void;
}>();

const initialMyDecks = computed(() => props.decks.filter((deck) => !deck.is_opponent));
const initialOpponentDecks = computed(() => props.decks.filter((deck) => deck.is_opponent));
const defaultFirstOrSecondProxy = computed({
  get: () => props.defaultFirstOrSecond,
  set: (value: 0 | 1) => emit('update:defaultFirstOrSecond', value),
});

const handleSaved = (payload: { duel: Duel; upsertDecks: Deck[] }) => {
  emit('duel-saved', payload);
};
</script>

<style scoped>
.duel-entry-section {
  margin-bottom: 24px;
}

.entry-toolbar {
  margin-bottom: 16px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.entry-toolbar__title {
  display: flex;
  align-items: center;
}

.default-toggle__icon {
  opacity: 0.9;
}

.default-toggle__toggle {
  border-width: 2px;
  background: rgba(var(--v-theme-surface), 0.9);
  border-color: rgba(var(--v-theme-on-surface), 0.25) !important;
}

.default-toggle__selected {
  background: rgba(var(--v-theme-primary), 0.25) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

.default-toggle__toggle :deep(.v-btn) {
  font-weight: 600;
}

/* 読みやすさ優先: ライト=黒 / ダーク=白 */
:deep(.v-theme--customLightTheme) .default-toggle__toggle :deep(.v-btn),
:deep(.v-theme--customLightTheme) .default-toggle__icon {
  color: #000 !important;
}

:deep(.v-theme--customDarkTheme) .default-toggle__toggle :deep(.v-btn),
:deep(.v-theme--customDarkTheme) .default-toggle__icon {
  color: #fff !important;
}

/* Tooltip（teleport先でも効くようにglobal指定） */
:global(.default-turn-tooltip) {
  font-weight: 600;
  padding: 8px 10px;
  border-radius: 8px;
  opacity: 1 !important;
}

:global(.v-theme--customLightTheme .default-turn-tooltip),
:global(.v-theme--customLightTheme.default-turn-tooltip) {
  color: #000 !important;
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.25) !important;
}

:global(.v-theme--customDarkTheme .default-turn-tooltip),
:global(.v-theme--customDarkTheme.default-turn-tooltip) {
  color: #fff !important;
  background: #111 !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
}
</style>
