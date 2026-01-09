<template>
  <component
    :is="inline ? 'div' : 'v-dialog'"
    v-bind="inline ? {} : dialogProps"
    :fullscreen="inline ? undefined : $vuetify.display.xs"
    class="duel-form-wrapper"
    @update:model-value="inline ? undefined : $emit('update:modelValue', $event)"
  >
    <v-card v-if="isActive" class="duel-form-card">
      <div class="card-glow"></div>

      <v-card-title class="pa-6">
        <v-icon class="mr-2" color="primary">mdi-file-document-edit</v-icon>
        <span class="text-h5">{{ isEdit ? '対戦記録を編集' : '新規対戦記録' }}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- ゲームモード選択タブ（編集時/ダイアログ時のみ） -->
        <v-tabs
          v-if="showGameModeTabs"
          v-model="form.game_mode"
          color="primary"
          class="mb-4 mode-tabs-dialog"
          show-arrows
        >
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

            <!-- 画面解析 -->
            <v-col cols="12">
              <div class="screen-analysis-panel">
	                <div class="analysis-header">
	                  <div class="analysis-title">
	                    <v-icon class="mr-2" size="small">mdi-monitor-eye</v-icon>
	                    <span class="text-subtitle-2">画面解析</span>
	                    <span class="text-caption text-error ml-2">※テスト機能</span>
	                  </div>
	                  <v-spacer />
	                  <v-btn
	                    size="small"
	                    :color="autoRegisterEnabled ? 'success' : 'grey'"
                    variant="tonal"
                    class="mr-2"
                    @click="autoRegisterEnabled = !autoRegisterEnabled"
                  >
                    <v-icon start>
                      {{ autoRegisterEnabled ? 'mdi-robot' : 'mdi-robot-off' }}
                    </v-icon>
                    自動登録{{ autoRegisterEnabled ? 'ON' : 'OFF' }}
                  </v-btn>
                  <v-btn
                    size="small"
                    :color="analysisRunning ? 'error' : 'primary'"
                    variant="tonal"
                    @click="toggleScreenAnalysis"
                  >
                    <v-icon start>
                      {{ analysisRunning ? 'mdi-stop-circle-outline' : 'mdi-monitor-screenshot' }}
                    </v-icon>
                    {{ analysisRunning ? '停止' : '開始' }}
                  </v-btn>
                </div>

                <div class="analysis-status">
                  <v-chip
                    size="small"
                    :color="analysisRunning ? 'success' : undefined"
                    variant="tonal"
                  >
                    {{ analysisRunning ? '解析中' : '停止中' }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="turnChoiceAvailable ? 'info' : undefined"
                    variant="tonal"
                  >
                    {{ turnChoiceAvailable ? '選択権: 検出' : '選択権: 未検出' }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="okButtonAvailable ? 'info' : undefined"
                    variant="tonal"
                  >
                    {{ okButtonAvailable ? 'OK: 検出' : 'OK: 未検出' }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="analysisResultLabel.color ?? undefined"
                    variant="tonal"
                  >
                    勝敗: {{ analysisResultLabel.text }}
                  </v-chip>
                  <v-chip
                    v-if="missingTemplateLabel"
                    size="small"
                    color="warning"
                    variant="tonal"
                  >
                    {{ missingTemplateLabel }}
                  </v-chip>
                  <span v-if="analysisScoreLabel" class="analysis-scores">
                    {{ analysisScoreLabel }}
                  </span>
                </div>

                <div class="analysis-actions" v-if="turnChoiceAvailable && !isEdit">
                  <v-btn size="small" color="secondary" variant="outlined" @click="setSecondTurn">
                    後攻に切替
                  </v-btn>
                </div>

                <div v-if="analysisError" class="analysis-error">
                  {{ analysisError }}
                </div>
                <div v-else-if="templateErrorLabel" class="analysis-error">
                  {{ templateErrorLabel }}
                </div>
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
        <v-btn variant="text" @click="closeDialog">
          {{ inline ? 'リセット' : 'キャンセル' }}
        </v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSubmit">
          <v-icon start>mdi-content-save</v-icon>
          {{ isEdit ? '更新' : '登録' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </component>
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
import { useScreenCaptureAnalysis } from '@/composables/useScreenCaptureAnalysis';

interface Props {
  modelValue: boolean;
  duel: Duel | null;
  inline?: boolean;
  defaultGameMode?: GameMode;
  defaultFirstOrSecond?: 0 | 1;
  initialMyDecks?: Deck[];
  initialOpponentDecks?: Deck[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultGameMode: 'RANK',
  defaultFirstOrSecond: 1,
  inline: false,
});
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [payload: { duel: Duel; upsertDecks: Deck[] }];
}>();

const notificationStore = useNotificationStore();
const { rules } = useDuelFormValidation();
const { getCurrentLocalDateTime, localDateTimeToISO, isoToLocalDateTime } = useDateTimeFormat();
const { resolveDeckId } = useDeckResolution();
const { fetchLatestValues, applyLatestValuesToGameMode, saveLastUsedValues } =
  useLatestDuelValues();

const formRef = ref();
const loading = ref(false);
const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);
const decksLoadedTarget = ref<'none' | 'active' | 'all'>('none');
let decksFetchPromise: Promise<void> | null = null;
const suppressCoinSync = ref(false);
const dialogProps = computed(() => ({
  modelValue: props.modelValue,
  maxWidth: 700,
  persistent: true,
}));
const isActive = computed(() => (props.inline ? true : props.modelValue));
const showGameModeTabs = computed(() => !props.inline || isEdit.value);

const {
  isRunning: analysisRunning,
  errorMessage: analysisError,
  lastResult,
  lastCoinResult,
  turnChoiceAvailable,
  okButtonAvailable,
  turnChoiceEventId,
  resultEventId,
  lastScores,
  missingTemplates,
  templateErrors,
  startCapture,
  stopCapture,
  resetState: resetScreenAnalysis,
} = useScreenCaptureAnalysis();

// 自動登録機能
const autoRegisterEnabled = ref(true);
const autoRegisterTimeoutId = ref<number | null>(null);

const missingTemplateLabel = computed(() => {
  if (missingTemplates.value.length === 0) return '';
  return `テンプレ未設定: ${missingTemplates.value.join(', ')}`;
});

const analysisResultLabel = computed(() => {
  if (lastResult.value === 'win') {
    return { text: '勝ち', color: 'success' };
  }
  if (lastResult.value === 'lose') {
    return { text: '負け', color: 'error' };
  }
  return { text: '未検出', color: undefined };
});

const analysisScoreLabel = computed(() => {
  if (!analysisRunning.value) return '';
  const scores = lastScores.value;
  return `score: ${scores.coinWin.toFixed(2)} / ${scores.coinLose.toFixed(2)} / ${scores.okButton.toFixed(2)} / ${scores.win.toFixed(2)} / ${scores.lose.toFixed(2)}`;
});

const templateErrorLabel = computed(() => {
  const entries = [
    ['coin-win', templateErrors.value.coinWin],
    ['coin-lose', templateErrors.value.coinLose],
    ['ok-button', templateErrors.value.okButton],
    ['result-win', templateErrors.value.win],
    ['result-lose', templateErrors.value.lose],
  ].filter((entry) => entry[1]);
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ');
});

const toggleScreenAnalysis = async () => {
  if (analysisRunning.value) {
    stopCapture();
    return;
  }
  await startCapture();
};

const setSecondTurn = () => {
  form.value.first_or_second = 0;
};

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
    // コインは「表」を基準に、先攻/後攻のデフォルトは別で持つ
    coin: 1,
    first_or_second: props.defaultFirstOrSecond,
    played_date: getCurrentLocalDateTime(),
    notes: '',
  };
};

const form = ref<DuelCreate>(defaultForm());

const isEdit = computed(() => !!props.duel);
const applyCoinDefault = (coin: 0 | 1, base: 0 | 1) => {
  // 後攻をデフォルトにしている場合、コインの結果に関わらず後攻を維持
  if (base === 0) {
    return 0;
  }
  // 先攻をデフォルトにしている場合、コインが表なら先攻、裏なら後攻
  return coin === 1 ? base : (base === 1 ? 0 : 1);
};

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
  const loadedTarget = decksLoadedTarget.value;
  if (loadedTarget === 'all') return;
  if (target === 'active' && loadedTarget === 'active') return;

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

const initializeForm = async () => {
  seedDecksFromProps();
  if (props.duel) {
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

    selectedMyDeck.value =
      props.duel.deck ?? myDecks.value.find((d) => d.id === props.duel?.deck_id) ?? null;
    selectedOpponentDeck.value =
      props.duel.opponent_deck ??
      opponentDecks.value.find((d) => d.id === props.duel?.opponent_deck_id) ??
      null;
    return;
  }

  await ensureDecksLoaded('active');
  await fetchLatestValues();
  form.value = defaultForm();
  form.value.game_mode = props.defaultGameMode;

  const applied = applyLatestValuesToGameMode(
    form.value.game_mode,
    myDecks.value,
    opponentDecks.value,
  );
  form.value.rank = applied.rank;
  form.value.rate_value = applied.rate_value;
  form.value.dc_value = applied.dc_value;
  selectedMyDeck.value = applied.selectedMyDeck;
  // 新規追加時は相手デッキを自動設定しない
  selectedOpponentDeck.value = null;
};

// fetchLatestValues, createDeckIfNeeded, resolveDeckId はcomposableから取得

// ダイアログが開いたらデッキを取得
watch(
  () => isActive.value,
  async (newValue) => {
    if (newValue) {
      await initializeForm();
    } else {
      if (!props.inline) {
        stopCapture();
        resetScreenAnalysis();
      }
    }
  },
  { immediate: true },
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

watch(
  () => props.defaultGameMode,
  (newMode) => {
    if (!props.inline || isEdit.value) return;
    if (form.value.game_mode === newMode) return;
    form.value.game_mode = newMode;
  },
);

// コイン結果に連動して先攻/後攻を自動設定
watch(
  () => form.value.coin,
  (newCoin) => {
    // 編集モードでは自動変更しない（意図しない書き換え防止）
    if (isEdit.value) return;
    if (suppressCoinSync.value) {
      suppressCoinSync.value = false;
      return;
    }
    // コインが表のときはセグメントで指定した値、裏のときは後攻をデフォルトとする
    const base = props.defaultFirstOrSecond;
    form.value.first_or_second = applyCoinDefault(newCoin as 0 | 1, base);
  },
);

watch(
  () => props.defaultFirstOrSecond,
  (newBase) => {
    if (isEdit.value) return;
    if (turnChoiceEventId.value > 0) return;
    form.value.first_or_second = applyCoinDefault(form.value.coin as 0 | 1, newBase);
  },
);

watch(turnChoiceEventId, () => {
  if (isEdit.value) return;
  suppressCoinSync.value = true;

  // コイン判定結果に基づいて設定
  if (lastCoinResult.value === 'win') {
    // コイン表（勝ち）: 自分が選択権を持つ
    form.value.coin = 1;
    form.value.first_or_second = props.defaultFirstOrSecond;
  } else if (lastCoinResult.value === 'lose') {
    // コイン裏（負け）: 相手が選択権を持つ
    form.value.coin = 0;
    // 相手が選んだ結果、自分は逆になる（通常は後攻になることが多い）
    form.value.first_or_second = props.defaultFirstOrSecond === 1 ? 0 : 1;
  }
});

watch(resultEventId, () => {
  if (isEdit.value || !lastResult.value) return;
  form.value.result = lastResult.value === 'win' ? 1 : 0;

  // 自動登録機能
  if (autoRegisterEnabled.value && !isEdit.value) {
    // 既存のタイマーをクリア
    if (autoRegisterTimeoutId.value !== null) {
      window.clearTimeout(autoRegisterTimeoutId.value);
    }

    // 0.5秒後に自動登録
    autoRegisterTimeoutId.value = window.setTimeout(() => {
      autoRegisterDuel();
    }, 500);
  }
});

// 連続登録用にフォームをリセット
const resetFormForNextDuel = async () => {
  if (autoRegisterTimeoutId.value !== null) {
    window.clearTimeout(autoRegisterTimeoutId.value);
    autoRegisterTimeoutId.value = null;
  }
  formRef.value?.resetValidation();

  // 最新の値を取得してフォームを再初期化
  await initializeForm();
  resetScreenAnalysis();
  notificationStore.success('次の対戦を待機中...');
};

// 自動登録処理
const autoRegisterDuel = async () => {
  // 編集モードでは自動登録しない
  if (isEdit.value) return;

  // 使用デッキが設定されていない場合は登録しない
  if (!selectedMyDeck.value) {
    notificationStore.warning('自動登録: 使用デッキが設定されていません');
    return;
  }

  // 相手デッキが空欄の場合は「不明」に自動設定
  if (!selectedOpponentDeck.value) {
    const unknownDeck = opponentDecks.value.find(
      (d) => d.name === '不明' && d.is_opponent,
    );
    selectedOpponentDeck.value = unknownDeck ?? '不明';
  }

  // フォームのバリデーション
  const { valid } = await formRef.value.validate();
  if (!valid) {
    const errorMessages = formRef.value.errors.map((e: any) => e.errorMessages).flat();
    notificationStore.warning(
      `自動登録: ${errorMessages.join(', ') || '入力内容に不備があります'}`,
    );
    return;
  }

  loading.value = true;
  try {
    const myDeckId = await resolveDeckId(selectedMyDeck.value, false, myDecks.value);
    const opponentDeckId = await resolveDeckId(
      selectedOpponentDeck.value,
      true,
      opponentDecks.value,
    );
    if (!myDeckId || !opponentDeckId) {
      notificationStore.error('自動登録: デッキの解決に失敗しました');
      return;
    }

    const submitData = {
      deck_id: myDeckId,
      opponent_deck_id: opponentDeckId,
      played_date: localDateTimeToISO(getCurrentLocalDateTime()),
      is_win: form.value.result === 1,
      won_coin_toss: form.value.coin === 1,
      is_going_first: form.value.first_or_second === 1,
      game_mode: form.value.game_mode,
      rank: form.value.rank,
      rate_value: form.value.rate_value,
      dc_value: form.value.dc_value,
      notes: form.value.notes,
    };

    const response = await api.post('/duels/', submitData);
    notificationStore.success('対戦記録を自動登録しました');
    const savedDuel = response.data as Duel;

    const deckPayload =
      typeof selectedMyDeck.value === 'object' && selectedMyDeck.value
        ? selectedMyDeck.value
        : { id: myDeckId, name: String(selectedMyDeck.value), is_opponent: false, active: true };
    const opponentDeckPayload =
      typeof selectedOpponentDeck.value === 'object' && selectedOpponentDeck.value
        ? selectedOpponentDeck.value
        : {
            id: opponentDeckId,
            name: String(selectedOpponentDeck.value),
            is_opponent: true,
            active: true,
          };

    emit('saved', {
      duel: { ...savedDuel, deck: deckPayload, opponent_deck: opponentDeckPayload },
      upsertDecks: [deckPayload, opponentDeckPayload],
    });

    // 次の試合のためにフォームをリセット
    await resetFormForNextDuel();
  } catch (error) {
    console.error('Failed to auto-register duel:', error);
    notificationStore.error('自動登録に失敗しました');
  } finally {
    loading.value = false;
  }
};

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
  // 自動登録がスケジュールされている場合はキャンセル
  if (autoRegisterTimeoutId.value !== null) {
    window.clearTimeout(autoRegisterTimeoutId.value);
    autoRegisterTimeoutId.value = null;
  }

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
  if (props.inline) {
    formRef.value?.resetValidation();
    selectedMyDeck.value = null;
    selectedOpponentDeck.value = null;
    stopCapture();
    resetScreenAnalysis();
    void initializeForm();
    return;
  }

  emit('update:modelValue', false);
  formRef.value?.resetValidation();
  selectedMyDeck.value = null;
  selectedOpponentDeck.value = null;
  stopCapture();
  resetScreenAnalysis();
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

.duel-form-wrapper {
  width: 100%;
}

.screen-analysis-panel {
  padding: 12px 16px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 6px;
  background-color: rgba(128, 128, 128, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-title {
  display: flex;
  align-items: center;
  color: rgba(128, 128, 128, 0.8);
}

.analysis-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.analysis-scores {
  font-size: 0.75rem;
  color: rgba(128, 128, 128, 0.85);
}

.analysis-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-error {
  color: rgba(220, 38, 38, 0.9);
  font-size: 0.875rem;
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
