<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    persistent
    :fullscreen="$vuetify.display.xs"
    @update:model-value="$emit('update:modelValue', $event)"
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
        <v-tabs v-model="form.game_mode" color="primary" class="mb-4 mode-tabs-dialog" show-arrows>
          <v-tab value="RANK">
            <v-icon :start="$vuetify.display.smAndUp">mdi-crown</v-icon>
            <span class="d-none d-sm-inline">ランク</span>
          </v-tab>
          <v-tab value="RATE">
            <v-icon :start="$vuetify.display.smAndUp">mdi-chart-line</v-icon>
            <span class="d-none d-sm-inline">レート</span>
          </v-tab>
          <v-tab value="EVENT">
            <v-icon :start="$vuetify.display.smAndUp">mdi-calendar-star</v-icon>
            <span class="d-none d-sm-inline">イベント</span>
          </v-tab>
          <v-tab value="DC">
            <v-icon :start="$vuetify.display.smAndUp">mdi-trophy-variant</v-icon>
            <span class="d-none d-sm-inline">DC</span>
          </v-tab>
        </v-tabs>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- 使用デッキ -->
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedMyDeck"
                :items="myDecks"
                item-title="name"
                item-value="id"
                label="使用デッキ"
                prepend-inner-icon="mdi-cards"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
                clearable
                placeholder="デッキを選択または入力"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>
                      新しいデッキ名を入力できます（登録時に自動追加）
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-combobox>
            </v-col>

            <!-- 相手デッキ -->
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedOpponentDeck"
                :items="opponentDecks"
                item-title="name"
                item-value="id"
                label="相手デッキ"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="secondary"
                :rules="[rules.required]"
                clearable
                placeholder="デッキを選択または入力"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>
                      新しいデッキ名を入力できます（登録時に自動追加）
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-combobox>
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
        <v-btn variant="text" @click="closeDialog"> キャンセル </v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSubmit">
          <v-icon start>mdi-content-save</v-icon>
          {{ isEdit ? '更新' : '登録' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { api } from '../../services/api';
import { Duel, DuelCreate, Deck, GameMode } from '../../types';
import { useNotificationStore } from '../../stores/notification';
import { RANKS } from '../../utils/ranks';

interface Props {
  modelValue: boolean;
  duel: Duel | null;
  defaultGameMode?: GameMode;
}

// Default values
const DEFAULT_RANK = 18; // プラチナ5
const DEFAULT_RATE = 1500;
const DEFAULT_DC = 0;

const props = withDefaults(defineProps<Props>(), {
  defaultGameMode: 'RANK',
});
const emit = defineEmits(['update:modelValue', 'saved']);

const notificationStore = useNotificationStore();

const formRef = ref();
const loading = ref(false);
const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);
const latestValues = ref<{ [key: string]: { value: number; deck_id: number; opponentDeck_id: number } }>({});

// コンボボックス用の選択値
const selectedMyDeck = ref<Deck | string | null>(null);
const selectedOpponentDeck = ref<Deck | string | null>(null);

const defaultForm = (): DuelCreate => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

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
    notes: '',
  };
};

const form = ref<DuelCreate>(defaultForm());

const isEdit = computed(() => !!props.duel);

const coinOptions = [
  { title: '表', value: true },
  { title: '裏', value: false },
];

const turnOptions = [
  { title: '先攻', value: true },
  { title: '後攻', value: false },
];

const resultOptions = [
  { title: '勝ち', value: true },
  { title: '負け', value: false },
];

const rules = {
  required: (v: any) => (v !== null && v !== undefined && v !== '') || '入力必須です',
  number: (v: any) => (!isNaN(v) && v >= 0) || '0以上の数値を入力してください',
  maxLength: (v: string) => !v || v.length <= 1000 || '1000文字以内で入力してください',
};

// datetime-local形式の文字列をタイムゾーン情報なしのISO形式に変換
const localDateTimeToISO = (localDateTime: string): string => {
  // datetime-local形式: "2025-10-04T05:36"
  // ユーザーが入力した時刻をそのまま保存するため、秒とミリ秒を追加するだけ
  return `${localDateTime}:00`;
};

// ISO文字列をdatetime-local形式に変換
const isoToLocalDateTime = (isoString: string): string => {
  // タイムゾーン情報とミリ秒を削除して、datetime-local形式に変換
  // "2025-10-04T05:36:00" または "2025-10-04T05:36:00.000Z" → "2025-10-04T05:36"
  return isoString.replace(/\.\d{3}Z?$/, '').substring(0, 16);
};

// デッキ一覧を取得
const fetchDecks = async () => {
  try {
    // 編集モードの場合はアーカイブされたデッキも含める
    const activeOnly = !isEdit.value;
    const response = await api.get(`/decks/?active_only=${activeOnly}`);
    const allDecks = response.data;
    myDecks.value = allDecks.filter((d: Deck) => !d.is_opponent);
    opponentDecks.value = allDecks.filter((d: Deck) => d.is_opponent);
  } catch (error) {
    console.error('Failed to fetch decks:', error);
  }
};

const fetchLatestValues = async () => {
  try {
    const response = await api.get('/duels/latest-values/');
    latestValues.value = response.data;
  } catch (error) {
    console.error('Failed to fetch latest values:', error);
    latestValues.value = {};
  }
};

// 新しいデッキを作成（登録ボタン押下時のみ）
const createDeckIfNeeded = async (name: string, isOpponent: boolean): Promise<number | null> => {
  try {
    const trimmedName = name.trim();

    // 既に同じ名前のデッキが存在するかチェック
    const decks = isOpponent ? opponentDecks.value : myDecks.value;
    const existingDeck = decks.find((d) => d.name === trimmedName);
    if (existingDeck) {
      return existingDeck.id;
    }

    // 新しいデッキを作成
    const response = await api.post('/decks/', {
      name: trimmedName,
      is_opponent: isOpponent,
    });

    const newDeck = response.data;
    const deckType = isOpponent ? '相手のデッキ' : '自分のデッキ';
    notificationStore.success(`${deckType}「${trimmedName}」を登録しました`);

    return newDeck.id;
  } catch (error: any) {
    // 重複エラーの場合は既存のデッキを検索
    if (error.response?.status === 400) {
      const decks = isOpponent ? opponentDecks.value : myDecks.value;
      const existingDeck = decks.find((d) => d.name === name.trim());
      if (existingDeck) {
        return existingDeck.id;
      }
    }
    console.error('Failed to create deck:', error);
    throw error;
  }
};

// デッキIDを取得（既存デッキまたは新規作成）
const resolveDeckId = async (
  selected: Deck | string | null,
  isOpponent: boolean,
): Promise<number | null> => {
  if (!selected) {
    return null;
  }

  // オブジェクトの場合（既存のデッキを選択）
  if (typeof selected === 'object' && selected.id) {
    return selected.id;
  }

  // 文字列の場合（新しいデッキ名を入力）
  if (typeof selected === 'string' && selected.trim()) {
    return await createDeckIfNeeded(selected, isOpponent);
  }

  return null;
};

// ダイアログが開いたらデッキを取得
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      await fetchDecks();
      if (props.duel) {
        // 編集モード
        // ISO文字列をdatetime-local形式に変換
        const localDateTime = isoToLocalDateTime(props.duel.played_date);

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
          notes: props.duel.notes || '',
        };

        // 選択されたデッキを設定
        selectedMyDeck.value = myDecks.value.find((d) => d.id === props.duel?.deck_id) || null;
        selectedOpponentDeck.value =
          opponentDecks.value.find((d) => d.id === props.duel?.opponentDeck_id) || null;
      } else {
        // 新規作成モード
        await fetchLatestValues();
        form.value = defaultForm();
        form.value.game_mode = props.defaultGameMode;
        selectedMyDeck.value = null;
        selectedOpponentDeck.value = null;

        // Set initial value based on game mode
        const latest = latestValues.value[form.value.game_mode];
        if (latest) {
          if (form.value.game_mode === 'RANK') {
            form.value.rank = latest.value ?? DEFAULT_RANK;
          } else if (form.value.game_mode === 'RATE') {
            form.value.rate_value = latest.value ?? DEFAULT_RATE;
          } else if (form.value.game_mode === 'DC') {
            form.value.dc_value = latest.value ?? DEFAULT_DC;
          }
          selectedMyDeck.value = myDecks.value.find((d) => d.id === latest.deck_id) || null;
        } else {
          // If no latest value, use defaults and clear deck selections
          if (form.value.game_mode === 'RANK') {
            form.value.rank = DEFAULT_RANK;
          } else if (form.value.game_mode === 'RATE') {
            form.value.rate_value = DEFAULT_RATE;
          } else if (form.value.game_mode === 'DC') {
            form.value.dc_value = DEFAULT_DC;
          }
          selectedMyDeck.value = null;
          selectedOpponentDeck.value = null;
        }
      }
    }
  },
);

// ゲームモードが変わったらrank/rate_value/dc_valueをクリア
watch(
  () => form.value.game_mode,
  (newMode) => {
    // 編集モードでは値を変更しない
    if (isEdit.value) return;

    form.value.rank = undefined;
    form.value.rate_value = undefined;
    form.value.dc_value = undefined;

    const latest = latestValues.value[newMode];
    if (latest) {
      if (newMode === 'RANK') {
        form.value.rank = latest.value ?? DEFAULT_RANK;
      } else if (newMode === 'RATE') {
        form.value.rate_value = latest.value ?? DEFAULT_RATE;
      } else if (newMode === 'DC') {
        form.value.dc_value = latest.value ?? DEFAULT_DC;
      }
      selectedMyDeck.value = myDecks.value.find((d) => d.id === latest.deck_id) || null;
    } else {
      // If no latest value, use defaults and clear deck selections
      if (newMode === 'RANK') {
        form.value.rank = DEFAULT_RANK;
      } else if (newMode === 'RATE') {
        form.value.rate_value = DEFAULT_RATE;
      } else if (newMode === 'DC') {
        form.value.dc_value = DEFAULT_DC;
      }
      selectedMyDeck.value = null;
      selectedOpponentDeck.value = null;
    }
  },
);

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // デッキIDを解決（必要に応じて新規作成）
    const myDeckId = await resolveDeckId(selectedMyDeck.value, false);
    const opponentDeckId = await resolveDeckId(selectedOpponentDeck.value, true);

    if (!myDeckId || !opponentDeckId) {
      notificationStore.error('デッキの登録に失敗しました');
      loading.value = false;
      return;
    }

    // datetime-local形式をISO文字列に変換（ローカルタイムゾーンを保持）
    const submitData = {
      ...form.value,
      deck_id: myDeckId,
      opponentDeck_id: opponentDeckId,
      played_date: localDateTimeToISO(form.value.played_date),
    };

    if (isEdit.value && props.duel) {
      await api.put(`/duels/${props.duel.id}`, submitData);
      notificationStore.success('対戦記録を更新しました');
    } else {
      await api.post('/duels/', submitData);
      notificationStore.success('対戦記録を登録しました');
    }

    emit('saved');
    closeDialog();
  } catch (error) {
    console.error('Failed to save duel:', error);
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
  formRef.value?.resetValidation();
  selectedMyDeck.value = null;
  selectedOpponentDeck.value = null;
};
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
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

// スマホ対応
@media (max-width: 599px) {
  .duel-form-card {
    .v-card-title {
      padding: 16px !important;

      .text-h5 {
        font-size: 1.25rem !important;
      }
    }

    .v-card-text {
      padding: 16px !important;
    }
  }

  .mode-tabs-dialog {
    .v-tab {
      min-width: 60px;
      padding: 0 12px;
      font-size: 0.875rem;
    }
  }
}
</style>
