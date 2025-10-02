<template>
  <v-data-table
    :headers="headers"
    :items="duels"
    :loading="loading"
    class="duel-table"
    hover
    density="comfortable"
  >
    <!-- 勝敗カラム -->
    <template #item.result="{ item }">
      <v-chip
        :color="item.result ? 'success' : 'error'"
        variant="flat"
        class="font-weight-bold"
      >
        <v-icon start>
          {{ item.result ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
        {{ item.result ? '勝利' : '敗北' }}
      </v-chip>
    </template>

    <!-- 使用デッキカラム -->
    <template #item.deck="{ item }">
      <v-chip
        color="primary"
        variant="tonal"
      >
        {{ item.deck?.name || '不明' }}
      </v-chip>
    </template>

    <!-- 相手デッキカラム -->
    <template #item.opponentdeck="{ item }">
      <v-chip
        color="secondary"
        variant="tonal"
      >
        {{ item.opponentdeck?.name || '不明' }}
      </v-chip>
    </template>

    <!-- コインカラム -->
    <template #item.coin="{ item }">
      <v-icon
        :color="item.coin ? 'warning' : 'grey'"
      >
        {{ item.coin ? 'mdi-alpha-h-circle' : 'mdi-alpha-t-circle' }}
      </v-icon>
      {{ item.coin ? '表' : '裏' }}
    </template>

    <!-- 先攻/後攻カラム -->
    <template #item.first_or_second="{ item }">
      <v-icon
        :color="item.first_or_second ? 'info' : 'purple'"
      >
        {{ item.first_or_second ? 'mdi-numeric-1-circle' : 'mdi-numeric-2-circle' }}
      </v-icon>
      {{ item.first_or_second ? '先攻' : '後攻' }}
    </template>

    <!-- ランク/レートカラム -->
    <template #item.rank_or_rate="{ item }">
      <v-chip
        v-if="item.game_mode === 'RANK' && item.rank"
        color="warning"
        variant="outlined"
      >
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
        v-else-if="item.game_mode === 'EVENT'"
        color="secondary"
        variant="outlined"
      >
        <v-icon start size="small">mdi-calendar-star</v-icon>
        EVENT
      </v-chip>
      <span v-else class="text-grey">-</span>
    </template>

    <!-- プレイ日時カラム -->
    <template #item.played_date="{ item }">
      {{ formatDate(item.played_date) }}
    </template>

    <!-- 備考カラム -->
    <template #item.notes="{ item }">
      <span v-if="item.notes">{{ item.notes }}</span>
      <span v-else class="text-grey">-</span>
    </template>

    <!-- アクションカラム -->
    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-pencil"
        variant="text"
        @click="$emit('edit', item)"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        color="error"
        @click="$emit('delete', item.id)"
      />
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
import { Duel } from '../../types'
import { getRankName } from '../../utils/ranks'

defineProps<{
  duels: Duel[]
  loading: boolean
}>()

defineEmits<{
  refresh: []
  edit: [duel: Duel]
  delete: [id: number]
}>()

const headers = [
  { title: '使用デッキ', key: 'deck', sortable: false },
  { title: 'コイン', key: 'coin', sortable: false, width: 100 },
  { title: '先攻/後攻', key: 'first_or_second', sortable: false, width: 120 },
  { title: '相手デッキ', key: 'opponentdeck', sortable: false },
  { title: '勝敗', key: 'result', sortable: true, width: 100 },
  { title: 'ランク/レート', key: 'rank_or_rate', sortable: false, width: 120 },
  { title: '備考', key: 'notes', sortable: false, width: 200 },
  { title: 'プレイ日時', key: 'played_date', sortable: true },
  { title: 'アクション', key: 'actions', sortable: false, width: 120, align: 'center' }
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style lang="scss">
.duel-table {
  background: transparent !important;

  .v-data-table__th {
    background: rgba(26, 31, 58, 0.5) !important;
    color: rgba(228, 231, 236, 0.8) !important;
    font-weight: 600 !important;
    text-transform: uppercase;
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
</style>