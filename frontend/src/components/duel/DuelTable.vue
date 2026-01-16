<template>
  <!-- モバイル: コンパクトカード表示 -->
  <div v-if="isMobile" class="duel-cards">
    <div v-if="loading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <template v-else-if="duels.length > 0">
      <div
        v-for="duel in duels"
        :key="duel.id"
        class="duel-card-compact"
      >
        <!-- 勝敗インジケーター -->
        <div class="result-indicator" :class="duel.is_win ? 'win' : 'lose'" />

        <!-- メインコンテンツ -->
        <div class="card-content">
          <!-- 1行目: デッキ対戦 + 日時 -->
          <div class="deck-row">
            <span class="deck-names">
              <span class="my-deck">{{ duel.deck?.name || '?' }}</span>
              <span class="vs">vs</span>
              <span class="opponent-deck">{{ duel.opponent_deck?.name || '?' }}</span>
            </span>
            <span class="date-text">{{ formatDateShort(duel.played_date) }}</span>
          </div>

          <!-- 2行目: 詳細情報（テキスト表示） -->
          <div class="detail-row">
            <span class="detail-item" :class="duel.is_going_first ? 'first' : 'second'">
              {{ duel.is_going_first ? LL?.duels.turnOrder.first() : LL?.duels.turnOrder.second() }}
            </span>
            <span class="detail-item" :class="duel.won_coin_toss ? 'coin-win' : 'coin-lose'">
              {{ duel.won_coin_toss ? LL?.duels.coinToss.win() : LL?.duels.coinToss.lose() }}
            </span>
            <!-- ランク/レート/DC表示 -->
            <span v-if="duel.game_mode === 'RANK' && duel.rank" class="detail-item metric">
              {{ getRankNameShort(duel.rank) }}
            </span>
            <span v-else-if="duel.game_mode === 'RATE' && duel.rate_value !== undefined" class="detail-item metric">
              {{ duel.rate_value }}
            </span>
            <span v-else-if="duel.game_mode === 'DC' && duel.dc_value !== undefined" class="detail-item metric">
              {{ duel.dc_value }}
            </span>
            <!-- 備考アイコン -->
            <span v-if="duel.notes" class="detail-item" :title="duel.notes">
              <v-icon size="14" color="grey">mdi-note-text</v-icon>
            </span>
          </div>
        </div>

        <!-- アクションボタン -->
        <div v-if="showActionButtons" class="action-buttons">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="x-small"
            color="primary"
            @click.stop="$emit('edit', duel)"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="x-small"
            color="error"
            @click.stop="$emit('delete', duel.id)"
          />
        </div>
      </div>
    </template>
    <div v-else class="text-center pa-8">
      <v-icon size="48" color="grey">mdi-file-document-outline</v-icon>
      <p class="text-body-1 text-grey mt-2">{{ LL?.duels.table.noRecords() }}</p>
    </div>
  </div>

  <!-- デスクトップ: テーブル表示 -->
  <v-data-table
    v-else
    :headers="computedHeaders"
    :items="duels"
    :loading="loading"
    class="duel-table"
    hover
    density="comfortable"
    mobile-breakpoint="0"
    fixed-header
    :height="tableHeightValue"
  >
    <!-- No.カラム -->
    <template #[`item.no`]="{ item, index }">
      <span class="text-grey">{{ item.no ?? duels.length - index }}</span>
    </template>

    <!-- 勝敗カラム -->
    <template #[`item.is_win`]="{ item }">
      <v-chip :color="item.is_win ? 'success' : 'error'" variant="flat" class="font-weight-bold">
        <v-icon start>
          {{ item.is_win ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
        {{ item.is_win ? LL?.duels.result.win() : LL?.duels.result.lose() }}
      </v-chip>
    </template>

    <!-- 使用デッキカラム -->
    <template v-if="!hiddenColumnsSet.has('deck')" #[`item.deck`]="{ item }">
      <v-chip color="primary" variant="outlined">
        {{ item.deck?.name || LL?.duels.table.unknown() }}
      </v-chip>
    </template>

    <!-- 相手デッキカラム -->
    <template v-if="!hiddenColumnsSet.has('opponent_deck')" #[`item.opponent_deck`]="{ item }">
      <v-chip :color="isDarkMode ? 'warning' : 'purple'" variant="outlined">
        {{ item.opponent_deck?.name || LL?.duels.table.unknown() }}
      </v-chip>
    </template>

    <!-- コインカラム -->
    <template v-if="!hiddenColumnsSet.has('won_coin_toss')" #[`item.won_coin_toss`]="{ item }">
      <v-icon :color="item.won_coin_toss ? 'warning' : 'grey'">
        {{ item.won_coin_toss ? 'mdi-alpha-h-circle' : 'mdi-alpha-t-circle' }}
      </v-icon>
      {{ item.won_coin_toss ? LL?.duels.coinToss.win() : LL?.duels.coinToss.lose() }}
    </template>

    <!-- 先攻/後攻カラム -->
    <template v-if="!hiddenColumnsSet.has('is_going_first')" #[`item.is_going_first`]="{ item }">
      <v-icon :color="item.is_going_first ? 'info' : 'purple'">
        {{ item.is_going_first ? 'mdi-numeric-1-circle' : 'mdi-numeric-2-circle' }}
      </v-icon>
      {{ item.is_going_first ? LL?.duels.turnOrder.first() : LL?.duels.turnOrder.second() }}
    </template>

    <!-- ランク/レートカラム -->
    <template v-if="!hiddenColumnsSet.has('rank_or_rate')" #[`item.rank_or_rate`]="{ item }">
      <v-chip v-if="item.game_mode === 'RANK' && item.rank" color="warning" variant="outlined">
        <v-icon start size="small">mdi-crown</v-icon>
        {{ getRankName(item.rank) }}
      </v-chip>
      <v-chip
        v-else-if="item.game_mode === 'RATE' && item.rate_value !== undefined"
        color="info"
        variant="outlined"
      >
        <v-icon start size="small">mdi-chart-line</v-icon>
        {{ item.rate_value }}
      </v-chip>
      <v-chip
        v-else-if="item.game_mode === 'DC' && item.dc_value !== undefined"
        color="warning"
        variant="outlined"
      >
        <v-icon start size="small">mdi-trophy-variant</v-icon>
        {{ item.dc_value }}
      </v-chip>
      <v-chip v-else-if="item.game_mode === 'EVENT'" color="secondary" variant="outlined">
        <v-icon start size="small">mdi-calendar-star</v-icon>
        EVENT
      </v-chip>
      <span v-else class="text-grey">-</span>
    </template>

    <!-- プレイ日時カラム -->
    <template #[`item.played_date`]="{ item }">
      {{ formatDate(item.played_date) }}
    </template>

    <!-- 備考カラム -->
    <template v-if="!hiddenColumnsSet.has('notes')" #[`item.notes`]="{ item }">
      <span v-if="item.notes">{{ item.notes }}</span>
      <span v-else class="text-grey">-</span>
    </template>

    <!-- アクションカラム -->
    <template v-if="showActionButtons" #[`item.actions`]="{ item }">
      <v-btn icon="mdi-pencil" variant="text" :aria-label="LL?.common.edit()" @click="$emit('edit', item)" />
      <v-btn icon="mdi-delete" variant="text" color="error" :aria-label="LL?.common.delete()" @click="$emit('delete', item.id)" />
    </template>

    <!-- ローディング -->
    <template #loading>
      <v-skeleton-loader type="table-row@10" />
    </template>

    <!-- データなし -->
    <template #no-data>
      <div class="text-center pa-8">
        <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
        <p class="text-h6 text-grey mt-4">{{ LL?.duels.table.noRecords() }}</p>
        <p class="text-body-1 text-grey">{{ LL?.duels.table.noRecordsHint() }}</p>
      </div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useThemeStore } from '@/stores/theme';
import { useLocale } from '@/composables/useLocale';
import { useRanks } from '@/composables/useRanks';
import { Duel } from '@/types';

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const themeStore = useThemeStore();
const isDarkMode = computed(() => themeStore.isDark);
const { LL } = useLocale();
const { getRankName } = useRanks();

const props = defineProps<{
  duels: Duel[];
  loading: boolean;
  showActions?: boolean;
  tableHeight?: string;
  hiddenColumns?: string[];
}>();

defineEmits<{
  refresh: [];
  edit: [duel: Duel];
  delete: [id: number];
}>();

const headers = computed(() => [
  { title: LL.value?.duels.table.noColumn() ?? 'No.', key: 'no', sortable: false, width: 60 },
  { title: LL.value?.duels.myDeck() ?? '使用デッキ', key: 'deck', sortable: false },
  { title: LL.value?.duels.opponentDeck() ?? '相手デッキ', key: 'opponent_deck', sortable: false },
  { title: LL.value?.duels.result.label() ?? '勝敗', key: 'is_win', sortable: true, width: 100 },
  { title: LL.value?.duels.coinToss.label() ?? 'コイン', key: 'won_coin_toss', sortable: false, width: 100, class: 'hidden-xs' },
  { title: LL.value?.duels.turnOrder.label() ?? '先攻/後攻', key: 'is_going_first', sortable: false, width: 120, class: 'hidden-xs' },
  { title: LL.value?.duels.table.rankOrRate() ?? 'ランク/レート', key: 'rank_or_rate', sortable: false, width: 120, class: 'hidden-xs' },
  { title: LL.value?.duels.memo() ?? '備考', key: 'notes', sortable: false, width: 200, class: 'hidden-sm-and-down' },
  { title: LL.value?.duels.playedAt() ?? 'プレイ日時', key: 'played_date', sortable: true, class: 'hidden-sm-and-down' },
  { title: LL.value?.duels.table.actions() ?? 'アクション', key: 'actions', sortable: false, width: 120, align: 'center' as const },
]);

const formatDate = (dateString: string) => {
  // ISO形式の文字列をそのまま表示用にフォーマット
  // "2025-10-04T05:36:00" → "2025/10/04 05:36"
  const cleanedString = dateString.replace(/\.\d{3}Z?$/, '');
  const [datePart, timePart] = cleanedString.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${year}/${month}/${day} ${hour}:${minute}`;
};

// モバイル用短縮日付フォーマット
const formatDateShort = (dateString: string) => {
  const cleanedString = dateString.replace(/\.\d{3}Z?$/, '');
  const [datePart, timePart] = cleanedString.split('T');
  const [, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${month}/${day} ${hour}:${minute}`;
};

// ランク名の短縮版を取得
const getRankNameShort = (rank: number) => {
  const name = getRankName(rank);
  // "ダイヤモンド1" -> "D1", "プラチナ5" -> "P5" など
  const shortNames: Record<string, string> = {
    'ルーキー': 'R',
    'ブロンズ': 'B',
    'シルバー': 'S',
    'ゴールド': 'G',
    'プラチナ': 'P',
    'ダイヤモンド': 'D',
    'マスター': 'M',
  };
  for (const [full, short] of Object.entries(shortNames)) {
    if (name.startsWith(full)) {
      return short + name.replace(full, '');
    }
  }
  return name;
};

const showActionButtons = computed(() => props.showActions !== false);
const hiddenColumnsSet = computed(() => new Set(props.hiddenColumns ?? []));

const computedHeaders = computed(() => {
  return headers.value.filter((header) => {
    if (header.key === 'actions') {
      return showActionButtons.value;
    }

    return !hiddenColumnsSet.value.has(header.key as string);
  });
});

const tableHeightValue = computed(() => props.tableHeight ?? '70vh');
</script>

<style lang="scss">
// モバイル: コンパクトカード表示
.duel-cards {
  max-height: 70vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.duel-card-compact {
  display: flex;
  align-items: stretch;
  background: rgba(var(--v-theme-surface), 0.95);
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);

  .result-indicator {
    width: 4px;
    flex-shrink: 0;

    &.win {
      background: rgb(var(--v-theme-success));
    }

    &.lose {
      background: rgb(var(--v-theme-error));
    }
  }

  .card-content {
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
  }

  .deck-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .deck-names {
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;

    .my-deck {
      color: rgb(var(--v-theme-primary));
    }

    .vs {
      color: rgba(var(--v-theme-on-surface), 0.5);
      margin: 0 4px;
      font-size: 11px;
    }

    .opponent-deck {
      color: rgb(var(--v-theme-warning));
    }
  }

  .date-text {
    font-size: 11px;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin-left: 8px;
    flex-shrink: 0;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 2px;
    color: rgba(var(--v-theme-on-surface), 0.7);

    &.first {
      color: rgb(var(--v-theme-info));
    }

    &.second {
      color: #ce93d8;
    }

    &.coin-win {
      color: rgb(var(--v-theme-warning));
    }

    &.coin-lose {
      color: rgba(var(--v-theme-on-surface), 0.5);
    }

    &.metric {
      color: rgba(var(--v-theme-on-surface), 0.7);
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-right: 4px;
    gap: 0;
  }
}

.duel-table {
  background: transparent !important;

  .v-data-table__th {
    background: rgb(var(--v-theme-surface-variant)) !important;
    color: rgb(var(--v-theme-on-surface)) !important;
    font-weight: 600 !important;
    text-transform: none;
    letter-spacing: 0.5px;
    font-size: 10px !important;
    white-space: nowrap;
  }

  .v-data-table__td {
    border-bottom: 1px solid rgba(0, 217, 255, 0.05) !important;
    font-size: 20px !important;

    .v-chip {
      font-size: 20px !important;
    }
  }

  .v-data-table__tr:hover {
    background: rgba(0, 217, 255, 0.05) !important;
  }
}

// スマホ対応
@media (max-width: 599px) {
  .duel-table {
    .v-data-table__th {
      font-size: 9px !important;
      padding: 0 8px !important;
    }

    .v-data-table__td {
      font-size: 14px !important;
      padding: 8px 4px !important;

      .v-chip {
        font-size: 12px !important;
        height: 24px !important;
        padding: 0 8px !important;
      }

      .v-icon {
        font-size: 18px !important;
      }

      .v-btn {
        width: 32px !important;
        height: 32px !important;
      }
    }
  }
}
</style>
