<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
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
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>デッキが見つかりません</v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- 相手デッキ -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.opponentdeck_id"
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
            <v-col cols="12" md="6">
              <v-select
                v-model="form.coin"
                :items="coinOptions"
                label="コイン"
                prepend-inner-icon="mdi-coin"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- 先攻/後攻 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.turn_order"
                :items="turnOrderOptions"
                label="先攻/後攻"
                prepend-inner-icon="mdi-swap-horizontal"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- 勝敗 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.result"
                :items="resultOptions"
                label="勝敗"
                prepend-inner-icon="mdi-trophy"
                variant="outlined"
                :color="form.result === 'win' ? 'success' : 'error'"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- ランク -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.rank"
                :items="rankOptions"
                label="ランク (任意)"
                prepend-inner-icon="mdi-star"
                variant="outlined"
                color="accent"
                clearable
              />
            </v-col>

            <!-- プレイ日時 -->
            <v-col cols="12">
              <v-text-field
                v-model="form.played_at"
                label="プレイ日時（自動入力）"
                prepend-inner-icon="mdi-calendar-clock"
                type="datetime-local"
                variant="outlined"
                color="primary"
                hint="デフォルトで現在の日時が入力されます"
                persistent-hint
              />
            </v-col>

            <!-- 備考 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="備考 (任意)"
                prepend-inner-icon="mdi-note-text"
                variant="outlined"
                color="primary"
                rows="3"
                placeholder="対戦の詳細やメモを記入..."
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
          {{ isEdit ? '更新' : '保存' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { api } from '../../services/api'
import { Duel, DuelCreate } from '../../types'
import { rankOptions } from '../../utils/ranks'

const props = defineProps<{
  modelValue: boolean
  duel?: Duel | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const formRef = ref()
const loading = ref(false)
const myDecks = ref<any[]>([])
const opponentDecks = ref<any[]>([])

const isEdit = ref(false)

// 現在の日時を取得する関数
const getCurrentDateTime = () => {
  return new Date().toISOString().slice(0, 16)
}

const form = ref<DuelCreate>({
  deck_id: null as any,
  opponentdeck_id: null,
  result: 'win',
  coin: 'heads',
  turn_order: 'first',
  rank: '',
  rating: undefined,
  notes: '',
  played_at: getCurrentDateTime()
})

const rules = {
  required: (v: any) => !!v || '入力必須です'
}

const coinOptions = [
  { title: '表', value: 'heads' },
  { title: '裏', value: 'tails' }
]

const turnOrderOptions = [
  { title: '先攻', value: 'first' },
  { title: '後攻', value: 'second' }
]

const resultOptions = [
  { title: '勝利', value: 'win' },
  { title: '敗北', value: 'lose' }
]

const fetchDecks = async () => {
  try {
    const response = await api.get('/decks/')
    const allDecks = response.data
    myDecks.value = allDecks.filter((d: any) => !d.is_opponent)
    opponentDecks.value = allDecks.filter((d: any) => d.is_opponent)
  } catch (error) {
    console.error('Failed to fetch decks:', error)
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  // 相手デッキが選択されていない場合はエラー
  if (!form.value.opponentdeck_id) {
    alert('相手デッキを選択してください')
    return
  }

  loading.value = true

  try {
    // バックエンドが期待する形式に変換
    const payload: any = {
      deck_id: form.value.deck_id,
      opponentDeck_id: form.value.opponentdeck_id,
      coin: form.value.coin === 'heads', // 'heads' -> true, 'tails' -> false
      first_or_second: form.value.turn_order === 'first', // 'first' -> true, 'second' -> false
      result: form.value.result === 'win', // 'win' -> true, 'lose' -> false
      played_date: form.value.played_at ? new Date(form.value.played_at).toISOString() : new Date().toISOString(),
      notes: form.value.notes || undefined
    }

    // rankは数値のみ送信
    if (form.value.rank) {
      payload.rank = typeof form.value.rank === 'number' ? form.value.rank : parseInt(form.value.rank)
    }

    console.log('送信するデータ:', payload)

    if (isEdit.value && props.duel) {
      await api.put(`/duels/${props.duel.id}`, payload)
    } else {
      await api.post('/duels/', payload)
    }

    emit('saved')
    closeDialog()
  } catch (error: any) {
    console.error('=== 保存エラー詳細 ===')
    console.error('エラーオブジェクト:', error)
    console.error('レスポンスデータ:', error.response?.data)
    console.error('ステータスコード:', error.response?.status)
    console.error('レスポンスヘッダー:', error.response?.headers)
    
    const errorDetail = error.response?.data?.detail
    let errorMessage = '保存に失敗しました\n\n'
    
    if (Array.isArray(errorDetail)) {
      errorMessage += errorDetail.map((err: any) => 
        `フィールド: ${err.loc?.join(' -> ')}\nエラー: ${err.msg}\n入力値: ${err.input}`
      ).join('\n\n')
    } else {
      errorMessage += JSON.stringify(errorDetail || error.message)
    }
    
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  form.value = {
    deck_id: null as any,
    opponentdeck_id: null,
    result: 'win',
    coin: 'heads',
    turn_order: 'first',
    rank: '',
    notes: '',
    played_at: getCurrentDateTime()
  }
  formRef.value?.resetValidation()
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.duel) {
      // 編集モード
      isEdit.value = true
      
      // played_dateを安全に変換
      let playedAtValue = getCurrentDateTime()
      if (props.duel.played_date) {
        try {
          const date = new Date(props.duel.played_date)
          if (!isNaN(date.getTime())) {
            playedAtValue = date.toISOString().slice(0, 16)
          }
        } catch (error) {
          console.error('日時の変換エラー:', error)
        }
      }
      
      form.value = {
        deck_id: props.duel.deck_id,
        opponentdeck_id: props.duel.opponentDeck_id,
        result: props.duel.result ? 'win' : 'lose',
        coin: props.duel.coin ? 'heads' : 'tails',
        turn_order: props.duel.first_or_second ? 'first' : 'second',
        rank: props.duel.rank || '',
        notes: props.duel.notes || '',
        played_at: playedAtValue
      }
    } else {
      // 新規追加モード（現在の日時をセット）
      isEdit.value = false
      resetForm()
    }
    fetchDecks()
  }
})

onMounted(() => {
  fetchDecks()
})
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
