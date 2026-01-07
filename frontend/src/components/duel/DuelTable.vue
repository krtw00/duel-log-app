<template>
  <v-data-table
    :headers="computedHeaders"
    :items="duels"
    :loading="loading"
    class="duel-table"
    hover
    density="comfortable"
    mobile-breakpoint="sm"
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
        {{ item.is_win ? '勝利' : '敗北' }}
      </v-chip>
    </template>

    <!-- 使用デッキカラム -->
    <template v-if="!hiddenColumnsSet.has('deck')" #[`item.deck`]="{ item }">
      <v-chip color="primary" variant="outlined">
        {{ item.deck?.name || '不明' }}
      </v-chip>
    </template>

    <!-- 相手デッキカラム -->
    <template v-if="!hiddenColumnsSet.has('opponent_deck')" #[`item.opponent_deck`]="{ item }">
      <v-chip :color="isDarkMode ? 'warning' : 'purple'" variant="outlined">
        {{ item.opponent_deck?.name || '不明' }}
      </v-chip>
    </template>

    <!-- コインカラム -->
    <template v-if="!hiddenColumnsSet.has('won_coin_toss')" #[`item.won_coin_toss`]="{ item }">
      <v-icon :color="item.won_coin_toss ? 'warning' : 'grey'">
        {{ item.won_coin_toss ? 'mdi-alpha-h-circle' : 'mdi-alpha-t-circle' }}
      </v-icon>
      {{ item.won_coin_toss ? '表' : '裏' }}
    </template>

    <!-- 先攻/後攻カラム -->
    <template v-if="!hiddenColumnsSet.has('is_going_first')" #[`item.is_going_first`]="{ item }">
      <v-icon :color="item.is_going_first ? 'info' : 'purple'">
        {{ item.is_going_first ? 'mdi-numeric-1-circle' : 'mdi-numeric-2-circle' }}
      </v-icon>
      {{ item.is_going_first ? '先攻' : '後攻' }}
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
      <v-btn icon="mdi-pencil" variant="text" @click="$emit('edit', item)" />
      <v-btn icon="mdi-delete" variant="text" color="error" @click="$emit('delete', item.id)" />
    </template>

    <!-- ローディング -->
    <template #loading>
      <v-skeleton-loader type="table-row@10" />
    </template>

    <!-- データなし -->
    <template #no-data>
      <div class="text-center pa-8">
        <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
        <p class="text-h6 text-grey mt-4">対戦記録がありません</p>
        <p class="text-body-1 text-grey">「対戦記録を追加」ボタンから記録を開始しましょう</p>
      </div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/theme';
import { Duel } from '@/types';
import { getRankName } from '@/utils/ranks';

const themeStore = useThemeStore();
const isDarkMode = computed(() => themeStore.isDark);

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

const headers = [
  { title: 'No.', key: 'no', sortable: false, width: 60 },
  { title: '使用デッキ', key: 'deck', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck', sortable: false },
  { title: '勝敗', key: 'is_win', sortable: true, width: 100 },
  { title: 'コイン', key: 'won_coin_toss', sortable: false, width: 100, class: 'hidden-xs' },
  { title: '先攻/後攻', key: 'is_going_first', sortable: false, width: 120, class: 'hidden-xs' },
  { title: 'ランク/レート', key: 'rank_or_rate', sortable: false, width: 120, class: 'hidden-xs' },
  { title: '備考', key: 'notes', sortable: false, width: 200, class: 'hidden-sm-and-down' },
  { title: 'プレイ日時', key: 'played_date', sortable: true, class: 'hidden-sm-and-down' },
  { title: 'アクション', key: 'actions', sortable: false, width: 120, align: 'center' },
] as const;

const formatDate = (dateString: string) => {
  // ISO形式の文字列をそのまま表示用にフォーマット
  // "2025-10-04T05:36:00" → "2025/10/04 05:36"
  const cleanedString = dateString.replace(/\.\d{3}Z?$/, '');
  const [datePart, timePart] = cleanedString.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${year}/${month}/${day} ${hour}:${minute}`;
};

const showActionButtons = computed(() => props.showActions !== false);
const hiddenColumnsSet = computed(() => new Set(props.hiddenColumns ?? []));

const computedHeaders = computed(() => {
  return headers.filter((header) => {
    if (header.key === 'actions') {
      return showActionButtons.value;
    }

    return !hiddenColumnsSet.value.has(header.key as string);
  });
});

const tableHeightValue = computed(() => props.tableHeight ?? '70vh');
</script>

<style lang="scss">
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
