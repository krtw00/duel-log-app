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
                :items="myDeckItems"
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
                :items="opponentDeckItems"
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
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-poker-chip</v-icon>
                  コイン
                </label>
                <v-radio-group
                  v-model.number="form.coin"
                  inline
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="表" :value="1"></v-radio>
                  <v-radio label="裏" :value="0"></v-radio>
                </v-radio-group>
              </div>
            </v-col>

            <!-- 先攻/後攻 -->
            <v-col cols="12" md="4">
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-swap-horizontal</v-icon>
                  先攻/後攻
                </label>
                <v-radio-group
                  v-model.number="form.first_or_second"
                  inline
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="先攻" :value="1"></v-radio>
                  <v-radio label="後攻" :value="0"></v-radio>
                </v-radio-group>
              </div>
            </v-col>

            <!-- 勝敗 -->
            <v-col cols="12" md="4">
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-trophy</v-icon>
                  勝敗
                </label>
                <v-radio-group
                  v-model.number="form.result"
                  inline
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="勝ち" :value="1" color="success"></v-radio>
                  <v-radio label="負け" :value="0" color="error"></v-radio>
                </v-radio-group>
              </div>
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
                step="0.01"
                placeholder="例: 2500.50"
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
                step="1"
                placeholder="例: 18500"
                :rules="
                  form.game_mode === 'DC' ? [rules.required, rules.number, rules.integer] : []
                "
                @input="handleDcValueInput"
              />
            </v-col>

            <!-- 対戦日時（編集時のみ表示） -->
            <v-col v-if="isEdit" cols="12" :md="form.game_mode === 'EVENT' ? 12 : 6">
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
import { api } from '@/services/api';
import { Duel, DuelCreate, Deck, GameMode } from '@/types';
import { useNotificationStore } from '@/stores/notification';
import { RANKS } from '@/utils/ranks';
import { useDuelFormValidation } from '@/composables/useDuelFormValidation';
import { useDateTimeFormat } from '@/composables/useDateTimeFormat';
import { useDeckResolution } from '@/composables/useDeckResolution';
import { useLatestDuelValues } from '@/composables/useLatestDuelValues';

interface Props {
  modelValue: boolean;
  duel: Duel | null;
  defaultGameMode?: GameMode;
  initialMyDecks?: Deck[];
  initialOpponentDecks?: Deck[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultGameMode: 'RANK',
});
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [payload: { duel: Duel; upsertDecks: Deck[] }];
}>();

const notificationStore = useNotificationStore();
const { rules } = useDuelFormValidation();
const { getCurrentLocalDateTime, localDateTimeToISO, isoToLocalDateTime } = useDateTimeFormat();
const { resolveDeckId } = useDeckResolution();
const { fetchLatestValues, applyLatestValuesToGameMode } = useLatestDuelValues();

const formRef = ref();
const loading = ref(false);
const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);
const decksLoadedTarget = ref<'none' | 'active' | 'all'>('none');
let decksFetchPromise: Promise<void> | null = null;

// コンボボックス用の選択値
const selectedMyDeck = ref<Deck | string | null>(null);
const selectedOpponentDeck = ref<Deck | string | null>(null);

const defaultForm = (): DuelCreate => {
  return {
    deck_id: null,
    opponent_deck_id: null,
    result: 1,
    game_mode: 'RANK',
    rank: undefined,
    rate_value: undefined,
    dc_value: undefined,
    coin: 1,
    first_or_second: 1,
    played_date: getCurrentLocalDateTime(),
    notes: '',
  };
};

const form = ref<DuelCreate>(defaultForm());

const isEdit = computed(() => !!props.duel);

// バリデーションルールと日時変換関数はcomposableから取得

const myDeckItems = computed(() =>
  isEdit.value ? myDecks.value : myDecks.value.filter((deck) => deck.active),
);
const opponentDeckItems = computed(() =>
  isEdit.value ? opponentDecks.value : opponentDecks.value.filter((deck) => deck.active),
);

// デッキ一覧を取得
const fetchDecks = async (activeOnly: boolean) => {
  try {
    const params = `active_only=${activeOnly}`;

    const [myDecksResponse, opponentDecksResponse] = await Promise.all([
      api.get(`/decks/?is_opponent=false&${params}`),
      api.get(`/decks/?is_opponent=true&${params}`),
    ]);

    myDecks.value = myDecksResponse.data;
    opponentDecks.value = opponentDecksResponse.data;
  } catch (error) {
    console.error('Failed to fetch decks:', error);
  }
};

const seedDecksFromProps = () => {
  if (decksLoadedTarget.value === 'all') return;

  const hasInitialDecks =
    (props.initialMyDecks && props.initialMyDecks.length > 0) ||
    (props.initialOpponentDecks && props.initialOpponentDecks.length > 0);

  if (!hasInitialDecks) return;

  myDecks.value = props.initialMyDecks ? [...props.initialMyDecks] : [];
  opponentDecks.value = props.initialOpponentDecks ? [...props.initialOpponentDecks] : [];

  if (decksLoadedTarget.value === 'none') {
    decksLoadedTarget.value = 'active';
  }
};

const ensureDecksLoaded = async (target: 'active' | 'all') => {
  if (decksLoadedTarget.value === 'all') return;
  if (target === 'active' && decksLoadedTarget.value === 'active') return;

  if (decksFetchPromise) {
    await decksFetchPromise;
    if (decksLoadedTarget.value === 'all') return;
    if (target === 'active' && decksLoadedTarget.value === 'active') return;
  }

  decksFetchPromise = (async () => {
    await fetchDecks(target === 'active');
    decksLoadedTarget.value = target;
  })().finally(() => {
    decksFetchPromise = null;
  });

  await decksFetchPromise;
};

// fetchLatestValues, createDeckIfNeeded, resolveDeckId はcomposableから取得

// ダイアログが開いたらデッキを取得
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      seedDecksFromProps();
      if (props.duel) {
        // 編集モード
        void ensureDecksLoaded('all').then(() => {
          if (!props.duel) return;
          if (selectedMyDeck.value === null) {
            selectedMyDeck.value = myDecks.value.find((d) => d.id === props.duel?.deck_id) || null;
          }
          if (selectedOpponentDeck.value === null) {
            selectedOpponentDeck.value =
              opponentDecks.value.find((d) => d.id === props.duel?.opponent_deck_id) || null;
          }
        });

        // ISO文字列をdatetime-local形式に変換
        const localDateTime = isoToLocalDateTime(props.duel.played_date);

        form.value = {
          deck_id: props.duel.deck_id,
          opponent_deck_id: props.duel.opponent_deck_id,
          result: props.duel.is_win ? 1 : 0,
          game_mode: props.duel.game_mode,
          rank: props.duel.rank,
          rate_value: props.duel.rate_value,
          dc_value: props.duel.dc_value,
          coin: props.duel.won_coin_toss ? 1 : 0,
          first_or_second: props.duel.is_going_first ? 1 : 0,
          played_date: localDateTime,
          notes: props.duel.notes || '',
        };

        // 選択されたデッキを設定
        selectedMyDeck.value =
          props.duel.deck ?? myDecks.value.find((d) => d.id === props.duel?.deck_id) ?? null;
        selectedOpponentDeck.value =
          props.duel.opponent_deck ??
          opponentDecks.value.find((d) => d.id === props.duel?.opponent_deck_id) ??
          null;
      } else {
        // 新規作成モード
        await ensureDecksLoaded('active');
        await fetchLatestValues();
        form.value = defaultForm();
        form.value.game_mode = props.defaultGameMode;

        // ゲームモードに応じた最新値を適用
        const applied = applyLatestValuesToGameMode(
          form.value.game_mode,
          myDecks.value,
          opponentDecks.value,
        );
        form.value.rank = applied.rank;
        form.value.rate_value = applied.rate_value;
        form.value.dc_value = applied.dc_value;
        selectedMyDeck.value = applied.selectedMyDeck;
        selectedOpponentDeck.value = applied.selectedOpponentDeck;
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

    // ゲームモードに応じた最新値を適用
    const applied = applyLatestValuesToGameMode(newMode, myDecks.value, opponentDecks.value);
    form.value.rank = applied.rank;
    form.value.rate_value = applied.rate_value;
    form.value.dc_value = applied.dc_value;
    selectedMyDeck.value = applied.selectedMyDeck;
    selectedOpponentDeck.value = applied.selectedOpponentDeck;
  },
);

// DCポイント入力ハンドラー（小数点入力を防ぐ）
const handleDcValueInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  // 空の場合はそのまま
  if (value === '' || value === null || value === undefined) {
    return;
  }

  // 数値に変換して整数化（小数点以下を切り捨て）
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    const intValue = Math.floor(numValue);
    if (numValue !== intValue) {
      // 小数が入力された場合、整数に変換
      form.value.dc_value = intValue;
      // 入力フィールドの値も更新
      target.value = String(intValue);
    }
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // デッキIDを解決（必要に応じて新規作成）
    const myDeckId = await resolveDeckId(selectedMyDeck.value, false, myDecks.value);
    const opponentDeckId = await resolveDeckId(
      selectedOpponentDeck.value,
      true,
      opponentDecks.value,
    );

    if (!myDeckId || !opponentDeckId) {
      notificationStore.error('デッキの登録に失敗しました');
      loading.value = false;
      return;
    }

    // 新規登録時は現在時刻を自動設定
    if (!isEdit.value) {
      form.value.played_date = getCurrentLocalDateTime();
    }

    // datetime-local形式をISO文字列に変換（ローカルタイムゾーンを保持）
    const submitData = {
      deck_id: myDeckId,
      opponent_deck_id: opponentDeckId,
      played_date: localDateTimeToISO(form.value.played_date),
      is_win: form.value.result === 1,
      won_coin_toss: form.value.coin === 1,
      is_going_first: form.value.first_or_second === 1,
      game_mode: form.value.game_mode,
      rank: form.value.rank,
      rate_value: form.value.rate_value,
      dc_value: form.value.dc_value,
      notes: form.value.notes,
    };

    const deckPayload: Deck =
      typeof selectedMyDeck.value === 'object' && selectedMyDeck.value
        ? selectedMyDeck.value
        : {
            id: myDeckId,
            name: typeof selectedMyDeck.value === 'string' ? selectedMyDeck.value.trim() : '不明',
            is_opponent: false,
            active: true,
          };
    const opponentDeckPayload: Deck =
      typeof selectedOpponentDeck.value === 'object' && selectedOpponentDeck.value
        ? selectedOpponentDeck.value
        : {
            id: opponentDeckId,
            name:
              typeof selectedOpponentDeck.value === 'string'
                ? selectedOpponentDeck.value.trim()
                : '不明',
            is_opponent: true,
            active: true,
          };

    let savedDuel: Duel | null = null;

    if (isEdit.value && props.duel) {
      const response = await api.put(`/duels/${props.duel.id}`, submitData);
      notificationStore.success('対戦記録を更新しました');
      savedDuel = {
        ...(props.duel as Duel),
        ...(response.data as Partial<Duel>),
        ...submitData,
        id: props.duel.id,
        deck: deckPayload,
        opponent_deck: opponentDeckPayload,
      };
    } else {
      const response = await api.post('/duels/', submitData);
      notificationStore.success('対戦記録を登録しました');
      savedDuel = {
        ...(response.data as Duel),
        ...submitData,
        deck: deckPayload,
        opponent_deck: opponentDeckPayload,
      };
    }

    if (savedDuel) {
      emit('saved', { duel: savedDuel, upsertDecks: [deckPayload, opponentDeckPayload] });
    }
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
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
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

.radio-group-wrapper {
  padding: 12px 16px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  background-color: rgba(128, 128, 128, 0.05);

  .radio-label {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: rgba(128, 128, 128, 0.7);
    margin-bottom: 8px;
  }

  :deep(.v-radio-group) {
    margin-top: 0;
  }

  :deep(.v-selection-control-group) {
    gap: 16px;
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

  .radio-group-wrapper {
    :deep(.v-selection-control-group) {
      gap: 8px;
    }
  }
}
</style>
