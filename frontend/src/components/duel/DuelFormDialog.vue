<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    max-width="700"
    persistent
  >
    <v-card class="duel-form-card">
      <div class="card-glow"></div>
      
      <v-card-title class="pa-6">
        <v-icon class="mr-2" color="primary">mdi-file-document-edit</v-icon>
        <span class="text-h5">{{ isEdit ? '対戦記録を編集' : '新規対戦記録' }}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- ゲームモード選択タブ -->
        <v-tabs
          v-model="form.game_mode"
          color="primary"
          class="mb-4"
        >
          <v-tab value="RANK">
            <v-icon start>mdi-crown</v-icon>
            ランク
          </v-tab>
          <v-tab value="RATE">
            <v-icon start>mdi-chart-line</v-icon>
            レート
          </v-tab>
          <v-tab value="EVENT">
            <v-icon start>mdi-calendar-star</v-icon>
            イベント
          </v-tab>
          <v-tab value="DC">
            <v-icon start>mdi-trophy-variant</v-icon>
            DC
          </v-tab>
        </v-tabs>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- 使用デッキ -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.deck_id"
                :items="myDecks"
                item-title="name"
                item-value="id"
                label="使用デッキ"
                prepend-inner-icon="mdi-cards"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
                clearable
              />
            </v-col>

            <!-- 相手デッキ -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.opponentDeck_id"
                :items="opponentDecks"
                item-title="name"
                item-value="id"
                label="相手デッキ"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="secondary"
                :rules="[rules.required]"
                clearable
              />
            </v-col>

            <!-- コイン -->
            <v-col cols="12" md="4">
              <v-select
                v-model="form.coin"
                :items="coinOptions"
                label="コイン"
                prepend-inner-icon="mdi-poker-chip"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- 先攻/後攻 -->
            <v-col cols="12" md="4">
              <v-select
                v-model="form.first_or_second"
                :items="turnOptions"
                label="先攻/後攻"
                prepend-inner-icon="mdi-swap-horizontal"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- 勝敗 -->
            <v-col cols="12" md="4">
              <v-select
                v-model="form.result"
                :items="resultOptions"
                label="勝敗"
                prepend-inner-icon="mdi-trophy"
                variant="outlined"
                :color="form.result ? 'success' : 'error'"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- ランク（RANKモード時のみ） -->
            <v-col v-if="form.game_mode === 'RANK'" cols="12" md="6">
              <v-select
                v-model="form.rank"
                :items="RANKS"
                item-title="label"
                item-value="value"
                label="ランク"
                prepend-inner-icon="mdi-crown"
                variant="outlined"
                color="warning"
                :rules="form.game_mode === 'RANK' ? [rules.required] : []"
              />
            </v-col>

            <!-- レート（RATEモード時のみ） -->
            <v-col v-if="form.game_mode === 'RATE'" cols="12" md="6">
              <v-text-field
                v-model.number="form.rate_value"
                label="レート"
                prepend-inner-icon="mdi-chart-line"
                variant="outlined"
                color="info"
                type="number"
                min="0"
                placeholder="例: 2500"
                :rules="form.game_mode === 'RATE' ? [rules.required, rules.number] : []"
              />
            </v-col>

            <!-- DC（DCモード時のみ） -->
            <v-col v-if="form.game_mode === 'DC'" cols="12" md="6">
              <v-text-field
                v-model.number="form.dc_value"
                label="DCポイント"
                prepend-inner-icon="mdi-trophy-variant"
                variant="outlined"
                color="warning"
                type="number"
                min="0"
                placeholder="例: 18500"
                :rules="form.game_mode === 'DC' ? [rules.required, rules.number] : []"
              />
            </v-col>

            <!-- 対戦日時 -->
            <v-col cols="12" :md="form.game_mode === 'EVENT' ? 12 : 6">
              <v-text-field
                v-model="form.played_date"
                label="対戦日時"
                prepend-inner-icon="mdi-calendar"
                variant="outlined"
                type="datetime-local"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- 備考 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="備考"
                prepend-inner-icon="mdi-note-text"
                variant="outlined"
                rows="3"
                counter="1000"
                placeholder="メモやコメントを入力"
                :rules="[rules.maxLength]"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
        >
          キャンセル
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          <v-icon start>mdi-content-save</v-icon>
          {{ isEdit ? '更新' : '登録' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { api } from '../../services/api'
import { Duel, DuelCreate, Deck, GameMode } from '../../types'
import { useNotificationStore } from '../../stores/notification'
import { RANKS } from '../../utils/ranks'

interface Props {
  modelValue: boolean
  duel: Duel | null
  defaultGameMode?: GameMode
}

// Default values
const DEFAULT_RANK = 18 // プラチナ5
const DEFAULT_RATE = 1500
const DEFAULT_DC = 0

const props = withDefaults(defineProps<Props>(), {
  defaultGameMode: 'RANK',
})
const emit = defineEmits(['update:modelValue', 'saved'])

const notificationStore = useNotificationStore()

const formRef = ref()
const loading = ref(false)
const myDecks = ref<Deck[]>([])
const opponentDecks = ref<Deck[]>([])
const latestValues = ref<{[key: string]: number}>({})

const defaultForm = (): DuelCreate => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
  
  return {
    deck_id: null,
    opponentDeck_id: null,
    result: true,
    game_mode: 'RANK',
    rank: undefined,
    rate_value: undefined,
    dc_value: undefined,
    coin: true,
    first_or_second: true,
    played_date: localDateTime,
    notes: ''
  }
}

const form = ref<DuelCreate>(defaultForm())

const isEdit = computed(() => !!props.duel)

const coinOptions = [
  { title: '表', value: true },
  { title: '裏', value: false }
]

const turnOptions = [
  { title: '先攻', value: true },
  { title: '後攻', value: false }
]

const resultOptions = [
  { title: '勝ち', value: true },
  { title: '負け', value: false }
]

const rules = {
  required: (v: any) => (v !== null && v !== undefined && v !== '') || '入力必須です',
  number: (v: any) => (!isNaN(v) && v >= 0) || '0以上の数値を入力してください',
  maxLength: (v: string) => !v || v.length <= 1000 || '1000文字以内で入力してください'
}

// デッキ一覧を取得
const fetchDecks = async () => {
  try {
    const response = await api.get('/decks/')
    const allDecks = response.data
    myDecks.value = allDecks.filter((d: Deck) => !d.is_opponent)
    opponentDecks.value = allDecks.filter((d: Deck) => d.is_opponent)
  } catch (error) {
    console.error('Failed to fetch decks:', error)
  }
}

const fetchLatestValues = async () => {
  try {
    const response = await api.get('/duels/latest-values/')
    latestValues.value = response.data
  } catch (error) {
    console.error('Failed to fetch latest values:', error)
    latestValues.value = {}
  }
}

// ダイアログが開いたらデッキを取得
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    await fetchDecks()
    if (props.duel) {
      // 編集モード
      // ISO文字列をdatetime-local形式に変換
      const playedDate = new Date(props.duel.played_date)
      const year = playedDate.getFullYear()
      const month = String(playedDate.getMonth() + 1).padStart(2, '0')
      const day = String(playedDate.getDate()).padStart(2, '0')
      const hours = String(playedDate.getHours()).padStart(2, '0')
      const minutes = String(playedDate.getMinutes()).padStart(2, '0')
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
      
      form.value = {
        deck_id: props.duel.deck_id,
        opponentDeck_id: props.duel.opponentDeck_id,
        result: props.duel.result,
        game_mode: props.duel.game_mode,
        rank: props.duel.rank,
        rate_value: props.duel.rate_value,
        dc_value: props.duel.dc_value,
        coin: props.duel.coin,
        first_or_second: props.duel.first_or_second,
        played_date: localDateTime,
        notes: props.duel.notes || ''
      }
    } else {
      // 新規作成モード
      await fetchLatestValues()
      form.value = defaultForm()
      form.value.game_mode = props.defaultGameMode
      
      // Set initial value based on game mode
      if (form.value.game_mode === 'RANK') {
        form.value.rank = latestValues.value.RANK ?? DEFAULT_RANK
      } else if (form.value.game_mode === 'RATE') {
        form.value.rate_value = latestValues.value.RATE ?? DEFAULT_RATE
      } else if (form.value.game_mode === 'DC') {
        form.value.dc_value = latestValues.value.DC ?? DEFAULT_DC
      }
    }
  }
})

// ゲームモードが変わったらrank/rate_value/dc_valueをクリア
watch(() => form.value.game_mode, (newMode) => {
  // 編集モードでは値を変更しない
  if (isEdit.value) return

  form.value.rank = undefined
  form.value.rate_value = undefined
  form.value.dc_value = undefined

  if (newMode === 'RANK') {
    form.value.rank = latestValues.value.RANK ?? DEFAULT_RANK
  } else if (newMode === 'RATE') {
    form.value.rate_value = latestValues.value.RATE ?? DEFAULT_RATE
  } else if (newMode === 'DC') {
    form.value.dc_value = latestValues.value.DC ?? DEFAULT_DC
  }
})

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    // datetime-local形式をISO文字列に変換
    const submitData = {
      ...form.value,
      played_date: new Date(form.value.played_date).toISOString()
    }
    
    if (isEdit.value && props.duel) {
      await api.put(`/duels/${props.duel.id}`, submitData)
      notificationStore.success('対戦記録を更新しました')
    } else {
      await api.post('/duels/', submitData)
      notificationStore.success('対戦記録を登録しました')
    }
    
    emit('saved')
    closeDialog()
  } catch (error) {
    console.error('Failed to save duel:', error)
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  formRef.value?.resetValidation()
}
</script>

<style scoped lang="scss">
.duel-form-card {
  background: rgba(18, 22, 46, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>
