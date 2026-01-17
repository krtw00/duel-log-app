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

      <v-card-title class="pa-4 pa-md-6">
        <v-icon class="mr-2" color="primary">mdi-file-document-edit</v-icon>
        <span class="text-h6 text-md-h5">{{ isEdit ? LL?.duels.form.editTitle() : LL?.duels.form.newTitle() }}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4 pa-md-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- 使用デッキ -->
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedMyDeck"
                :items="myDeckItems"
                item-title="name"
                item-value="id"
                :label="LL?.duels.myDeck()"
                prepend-inner-icon="mdi-cards"
                variant="outlined"
                color="primary"
                :rules="[rules.required]"
                clearable
                :placeholder="LL?.duels.form.selectOrInputDeck()"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ LL?.duels.form.newDeckHint() }}
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
                :label="LL?.duels.opponentDeck()"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="secondary"
                :rules="[rules.required]"
                clearable
                :placeholder="LL?.duels.form.selectOrInputDeck()"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ LL?.duels.form.newDeckHint() }}
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
                  {{ LL?.duels.coinToss.label() }}
                </label>
                <v-radio-group
                  v-model.number="form.coin"
                  :inline="!$vuetify.display.mobile"
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio :label="LL?.duels.coinToss.win()" :value="1"></v-radio>
                  <v-radio :label="LL?.duels.coinToss.lose()" :value="0"></v-radio>
                </v-radio-group>
              </div>
            </v-col>

            <!-- 先攻/後攻 -->
            <v-col cols="12" md="4">
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-swap-horizontal</v-icon>
                  {{ LL?.duels.turnOrder.label() }}
                </label>
                <v-radio-group
                  v-model.number="form.first_or_second"
                  :inline="!$vuetify.display.mobile"
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio :label="LL?.duels.turnOrder.first()" :value="1"></v-radio>
                  <v-radio :label="LL?.duels.turnOrder.second()" :value="0"></v-radio>
                </v-radio-group>
              </div>
            </v-col>

            <!-- 勝敗 -->
            <v-col cols="12" md="4">
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-trophy</v-icon>
                  {{ LL?.duels.result.label() }}
                </label>
                <v-radio-group
                  v-model.number="form.result"
                  :inline="!$vuetify.display.mobile"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio :label="LL?.duels.result.win()" :value="1" color="success"></v-radio>
                  <v-radio :label="LL?.duels.result.lose()" :value="0" color="error"></v-radio>
                </v-radio-group>
              </div>
            </v-col>

            <!-- 画面解析（新規作成時かつ設定で有効な場合のみ） -->
            <v-col v-if="!isEdit && screenAnalysisEnabled" cols="12">
              <div class="screen-analysis-panel">
                <div class="analysis-header">
                  <div class="analysis-title">
                    <v-icon class="mr-2" size="small">mdi-monitor-eye</v-icon>
                    <span class="text-subtitle-2">{{ LL?.duels.screenAnalysis.title() }}</span>
                    <span class="text-caption text-error ml-2">{{ LL?.duels.screenAnalysis.testFeature() }}</span>
                  </div>
                  <v-spacer />
                  <v-btn-toggle
                    v-model="analysisMethod"
                    density="compact"
                    mandatory
                    class="mr-2"
                    :disabled="analysisRunning"
                  >
                    <v-btn value="template" size="small" variant="tonal">
                      <v-icon start size="small">mdi-image-search</v-icon>
                      {{ LL?.duels.screenAnalysis.template() }}
                    </v-btn>
                    <v-btn value="tfjs" size="small" variant="tonal">
                      <v-icon start size="small">mdi-brain</v-icon>
                      {{ LL?.duels.screenAnalysis.ml() }}
                    </v-btn>
                  </v-btn-toggle>
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
                    {{ LL?.duels.screenAnalysis.autoRegister() }}{{ autoRegisterEnabled ? LL?.duels.screenAnalysis.on() : LL?.duels.screenAnalysis.off() }}
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
                    {{ analysisRunning ? LL?.duels.screenAnalysis.stop() : LL?.duels.screenAnalysis.start() }}
                  </v-btn>
                </div>

                <div class="analysis-description">
                  <v-icon class="mr-1" size="small" color="info">mdi-information</v-icon>
                  <span class="text-caption">
                    {{ LL?.duels.screenAnalysis.description() }}
                    <br />
                    <strong>{{
                      analysisMethod === 'template' ? LL?.duels.screenAnalysis.templateMode() : LL?.duels.screenAnalysis.mlMode()
                    }}</strong>
                    {{ LL?.duels.screenAnalysis.modeDescription() }}
                  </span>
                </div>

                <div class="analysis-status">
                  <v-chip
                    size="small"
                    :color="analysisRunning ? 'success' : undefined"
                    variant="tonal"
                  >
                    {{ analysisRunning ? LL?.duels.screenAnalysis.running() : LL?.duels.screenAnalysis.stopped() }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="turnChoiceAvailable ? 'info' : undefined"
                    variant="tonal"
                  >
                    {{ turnChoiceAvailable ? LL?.duels.screenAnalysis.turnChoiceDetected() : LL?.duels.screenAnalysis.turnChoiceNotDetected() }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="analysisResultLabel.color ?? undefined"
                    variant="tonal"
                  >
                    {{ LL?.duels.screenAnalysis.resultLabel() }}: {{ analysisResultLabel.text }}
                  </v-chip>
                  <v-chip
                    size="small"
                    :color="resultLockState === 'locked' ? 'warning' : 'success'"
                    variant="tonal"
                  >
                    {{ resultLockState === 'locked' ? LL?.duels.screenAnalysis.registered() : LL?.duels.screenAnalysis.canRegister() }}
                  </v-chip>
                  <v-chip v-if="missingTemplateLabel" size="small" color="warning" variant="tonal">
                    {{ missingTemplateLabel }}
                  </v-chip>
                  <span v-if="analysisScoreLabel" class="analysis-scores">
                    {{ analysisScoreLabel }}
                  </span>
                </div>

                <div class="analysis-actions" v-if="turnChoiceAvailable && !isEdit">
                  <v-btn size="small" color="secondary" variant="outlined" @click="setSecondTurn">
                    {{ LL?.duels.screenAnalysis.switchToSecond() }}
                  </v-btn>
                </div>

                <div v-if="analysisError" class="analysis-error">
                  {{ analysisError }}
                </div>
                <div v-else-if="templateErrorLabel" class="analysis-error">
                  {{ templateErrorLabel }}
                </div>

                <!-- ML学習データ収集用ボタン -->
                <MLTrainingDataButtons
                  v-if="analysisMethod === 'tfjs' && analysisRunning"
                  :folder-selected="trainingFolderSelected"
                  @select-folder="selectTrainingFolder"
                  @save-image="saveDebugImage"
                />
              </div>
            </v-col>

            <!-- ランク（RANKモード時のみ） -->
            <v-col v-if="form.game_mode === 'RANK'" cols="12" md="6">
              <v-select
                v-model="form.rank"
                :items="RANKS"
                item-title="label"
                item-value="value"
                :label="LL?.duels.gameMode.rank()"
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
                :label="LL?.duels.rateValue()"
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
                :label="LL?.duels.dcValue()"
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
                :label="LL?.duels.playedAt()"
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
                :label="LL?.duels.memo()"
                prepend-inner-icon="mdi-note-text"
                variant="outlined"
                rows="3"
                counter="1000"
                :placeholder="LL?.duels.form.memoPlaceholder()"
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
          {{ inline ? LL?.common.reset() : LL?.common.cancel() }}
        </v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSubmit">
          <v-icon start>mdi-content-save</v-icon>
          {{ isEdit ? LL?.common.update() : LL?.duels.form.register() }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </component>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { api } from '@/services/api';
import { notifyDuelUpdate } from '@/services/duelService';
import { createLogger } from '@/utils/logger';
import { Duel, DuelCreate, Deck, GameMode } from '@/types';
import { useNotificationStore } from '@/stores/notification';
import { useDuelFormValidation } from '@/composables/useDuelFormValidation';
import { useDateTimeFormat } from '@/composables/useDateTimeFormat';
import { useDeckResolution } from '@/composables/useDeckResolution';
import { useLatestDuelValues } from '@/composables/useLatestDuelValues';
import { useScreenCaptureAnalysis } from '@/composables/useScreenCaptureAnalysis';
import { useScreenCaptureAnalysisTfjs } from '@/composables/useScreenCaptureAnalysisTfjs';
import { useAuthStore } from '@/stores/auth';
import { useLocale } from '@/composables/useLocale';
import { useRanks } from '@/composables/useRanks';
import MLTrainingDataButtons, { type DebugLabel } from '@/components/duel/MLTrainingDataButtons.vue';

// 解析手法の型
type AnalysisMethod = 'template' | 'tfjs';

const logger = createLogger('DuelForm');

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
const authStore = useAuthStore();
const { LL } = useLocale();
const { RANKS } = useRanks();
const { rules } = useDuelFormValidation();
const { getCurrentLocalDateTime, localDateTimeToISO, isoToLocalDateTime } = useDateTimeFormat();
const { resolveDeckId } = useDeckResolution();
const { fetchLatestValues, applyLatestValuesToGameMode, saveLastUsedValues } =
  useLatestDuelValues();

const formRef = ref();
const loading = ref(false);
const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);
const screenAnalysisEnabled = computed(() => authStore.user?.enable_screen_analysis ?? false);
// バックエンドが既に認証ユーザーのデッキのみを返すため、フロントエンドでのフィルタリングは不要
const myDecksForUser = computed(() => myDecks.value);
const opponentDecksForUser = computed(() => opponentDecks.value);
const decksLoadedTarget = ref<'none' | 'active' | 'all'>('none');
let decksFetchPromise: Promise<void> | null = null;
const suppressCoinSync = ref(false);
const dialogProps = computed(() => ({
  modelValue: props.modelValue,
  maxWidth: 700,
  persistent: true,
}));
const isActive = computed(() => (props.inline ? true : props.modelValue));

// 解析手法の選択（デフォルトはテンプレートマッチング）
const analysisMethod = ref<AnalysisMethod>('template');

// テンプレートマッチング用 composable
const templateAnalysis = useScreenCaptureAnalysis();

// TensorFlow.js 用 composable
const tfjsAnalysis = useScreenCaptureAnalysisTfjs();

// 現在の解析手法に応じた状態を公開する computed
const analysisRunning = computed(
  () =>
    (analysisMethod.value === 'template' ? templateAnalysis.isRunning : tfjsAnalysis.isRunning)
      .value,
);
const analysisError = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.errorMessage
      : tfjsAnalysis.errorMessage
    ).value,
);
const lastResult = computed(
  () =>
    (analysisMethod.value === 'template' ? templateAnalysis.lastResult : tfjsAnalysis.lastResult)
      .value,
);
const lastCoinResult = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.lastCoinResult
      : tfjsAnalysis.lastCoinResult
    ).value,
);
const turnChoiceAvailable = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.turnChoiceAvailable
      : tfjsAnalysis.turnChoiceAvailable
    ).value,
);
const turnChoiceEventId = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.turnChoiceEventId
      : tfjsAnalysis.turnChoiceEventId
    ).value,
);
const resultEventId = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.resultEventId
      : tfjsAnalysis.resultEventId
    ).value,
);
const resultLockState = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.resultLockState
      : tfjsAnalysis.resultLockState
    ).value,
);
const lastScores = computed(
  () =>
    (analysisMethod.value === 'template' ? templateAnalysis.lastScores : tfjsAnalysis.lastScores)
      .value,
);
const missingTemplates = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.missingTemplates
      : tfjsAnalysis.missingTemplates
    ).value,
);
const templateErrors = computed(
  () =>
    (analysisMethod.value === 'template'
      ? templateAnalysis.templateErrors
      : tfjsAnalysis.templateErrors
    ).value,
);

// 解析開始・停止
const startCapture = async () => {
  if (analysisMethod.value === 'template') {
    await templateAnalysis.startCapture();
  } else {
    await tfjsAnalysis.startCapture();
  }
};
const stopCapture = () => {
  templateAnalysis.stopCapture();
  tfjsAnalysis.stopCapture();
};
const resetScreenAnalysis = () => {
  templateAnalysis.resetState();
  tfjsAnalysis.resetState();
};

// 自動登録機能
const autoRegisterEnabled = ref(true);
const autoRegisterTimeoutId = ref<number | null>(null);

const missingTemplateLabel = computed(() => {
  if (missingTemplates.value.length === 0) return '';
  return `${LL.value?.duels.screenAnalysis.missingTemplate()}: ${missingTemplates.value.join(', ')}`;
});

const analysisResultLabel = computed(() => {
  if (lastResult.value === 'win') {
    return { text: LL.value?.duels.result.win() ?? '勝ち', color: 'success' };
  }
  if (lastResult.value === 'lose') {
    return { text: LL.value?.duels.result.lose() ?? '負け', color: 'error' };
  }
  return { text: LL.value?.duels.screenAnalysis.notDetected() ?? '未検出', color: undefined };
});

const analysisScoreLabel = computed(() => {
  if (!analysisRunning.value) return '';
  const scores = lastScores.value;

  if (analysisMethod.value === 'tfjs') {
    // ML モード: モデル状態と予測ラベルも表示
    const status = tfjsAnalysis.modelStatus.value;
    const labels = tfjsAnalysis.lastPredictedLabels.value;
    const modelInfo = status.usingFallback ? '[fallback]' : '[ML]';
    return `${modelInfo} coin:${labels.coin}(${scores.coinWin.toFixed(2)}) result:${labels.result}(${scores.win.toFixed(2)}/${scores.lose.toFixed(2)})`;
  }

  return `score: ${scores.coinWin.toFixed(2)} / ${scores.coinLose.toFixed(2)} / ${scores.win.toFixed(2)} / ${scores.lose.toFixed(2)}`;
});

const templateErrorLabel = computed(() => {
  const entries = [
    ['coin-win', templateErrors.value.coinWin],
    ['coin-lose', templateErrors.value.coinLose],
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

// 学習データ保存先フォルダが選択済みか
const trainingFolderSelected = computed(() => tfjsAnalysis.hasTrainingDataFolder());

// 学習データ保存先フォルダを選択
const selectTrainingFolder = async () => {
  const success = await tfjsAnalysis.selectTrainingDataFolder();
  if (success) {
    notificationStore.success(LL.value?.duels.screenAnalysis.trainingFolderSet() ?? '学習データ保存先フォルダを設定しました');
  } else {
    notificationStore.warning(LL.value?.duels.screenAnalysis.trainingFolderCancelled() ?? 'フォルダの選択がキャンセルされました');
  }
};

const saveDebugImage = async (label: DebugLabel) => {
  if (analysisMethod.value !== 'tfjs') return;
  await tfjsAnalysis.saveDebugImages(label);
  notificationStore.success(`${LL.value?.duels.screenAnalysis.trainingDataSaved() ?? '学習データを保存しました'}: ${label}`);
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
  return coin === 1 ? base : base === 1 ? 0 : 1;
};

// バリデーションルールと日時変換関数はcomposableから取得

const mergeArchivedSelectedDeck = (items: Deck[], selected: Deck | string | null) => {
  if (!selected || typeof selected === 'string') return items;
  if (selected.active) return items;
  if (items.some((deck) => deck.id === selected.id)) return items;
  return [...items, selected];
};
const myDeckItems = computed(() => {
  const activeDecks = myDecksForUser.value.filter((deck) => deck.active);
  if (!isEdit.value) return activeDecks;
  return mergeArchivedSelectedDeck(activeDecks, selectedMyDeck.value);
});
const opponentDeckItems = computed(() => {
  const activeDecks = opponentDecksForUser.value.filter((deck) => deck.active);
  if (!isEdit.value) return activeDecks;
  return mergeArchivedSelectedDeck(activeDecks, selectedOpponentDeck.value);
});

const buildDeckPayload = (
  resolvedDeck: Deck | null,
  selected: Deck | string | null,
  deckId: number | null,
  isOpponent: boolean,
): Deck => {
  if (resolvedDeck) return resolvedDeck;
  let name = LL.value?.duels.table.unknown() ?? '不明';

  if (typeof selected === 'object' && selected?.name) {
    name = selected.name;
  } else if (typeof selected === 'string' && selected.trim()) {
    name = selected.trim();
  }

  return {
    id: deckId ?? 0,
    name,
    is_opponent: isOpponent,
    active: true,
    user_id: authStore.user?.id,
  };
};

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
    logger.error('Failed to fetch decks');
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

const applyModeDefaults = (mode: GameMode) => {
  form.value.rank = undefined;
  form.value.rate_value = undefined;
  form.value.dc_value = undefined;

  const applied = applyLatestValuesToGameMode(
    mode,
    myDecksForUser.value,
    opponentDecksForUser.value,
  );
  form.value.rank = applied.rank;
  form.value.rate_value = applied.rate_value;
  form.value.dc_value = applied.dc_value;
  selectedMyDeck.value = applied.selectedMyDeck;
  selectedOpponentDeck.value = applied.selectedOpponentDeck;
};

const initializeForm = async () => {
  seedDecksFromProps();
  if (props.duel) {
    void ensureDecksLoaded('all').then(() => {
      if (!props.duel) return;
      if (selectedMyDeck.value === null) {
        selectedMyDeck.value =
          myDecksForUser.value.find((d) => d.id === props.duel?.deck_id) || null;
      }
      if (selectedOpponentDeck.value === null) {
        selectedOpponentDeck.value =
          opponentDecksForUser.value.find((d) => d.id === props.duel?.opponent_deck_id) || null;
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
      props.duel.deck ?? myDecksForUser.value.find((d) => d.id === props.duel?.deck_id) ?? null;
    selectedOpponentDeck.value =
      props.duel.opponent_deck ??
      opponentDecksForUser.value.find((d) => d.id === props.duel?.opponent_deck_id) ??
      null;
    return;
  }

  await ensureDecksLoaded('active');
  await fetchLatestValues();
  form.value = defaultForm();
  form.value.game_mode = props.defaultGameMode;
  applyModeDefaults(form.value.game_mode);
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

watch(
  () => props.defaultGameMode,
  (newMode) => {
    if (!props.inline || isEdit.value) return;
    if (form.value.game_mode === newMode) return;
    form.value.game_mode = newMode;
    applyModeDefaults(newMode);
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
  notificationStore.success(LL.value?.duels.form.waitingNext() ?? '次の対戦を待機中...');
};

// 自動登録処理
const autoRegisterDuel = async () => {
  // 編集モードでは自動登録しない
  if (isEdit.value) return;

  // 使用デッキが設定されていない場合は登録しない
  if (!selectedMyDeck.value) {
    notificationStore.warning(LL.value?.duels.form.autoRegisterNoDeck() ?? '自動登録: 使用デッキが設定されていません');
    return;
  }

  // 相手デッキが空欄の場合は「不明」に自動設定
  if (!selectedOpponentDeck.value) {
    const unknownLabel = LL.value?.duels.table.unknown() ?? '不明';
    const unknownDeck = opponentDecksForUser.value.find((d) => d.name === unknownLabel && d.is_opponent);
    selectedOpponentDeck.value = unknownDeck ?? unknownLabel;
  }

  // フォームのバリデーション
  const { valid } = await formRef.value.validate();
  if (!valid) {
    const errorMessages = formRef.value.errors.map((e: any) => e.errorMessages).flat();
    notificationStore.warning(
      `${LL.value?.duels.form.autoRegisterFailed() ?? '自動登録に失敗しました'}: ${errorMessages.join(', ') || '入力内容に不備があります'}`,
    );
    return;
  }

  loading.value = true;
  try {
    const resolvedMyDeck = await resolveDeckId(selectedMyDeck.value, false, myDecksForUser.value);
    const resolvedOpponentDeck = await resolveDeckId(
      selectedOpponentDeck.value,
      true,
      opponentDecksForUser.value,
    );
    const myDeckId = resolvedMyDeck?.id ?? null;
    const opponentDeckId = resolvedOpponentDeck?.id ?? null;
    if (!myDeckId || !opponentDeckId) {
      notificationStore.error(LL.value?.duels.form.deckResolveFailed() ?? 'デッキの登録に失敗しました');
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
    notifyDuelUpdate(); // ポップアップに通知
    notificationStore.success(LL.value?.duels.form.autoRegisterSuccess() ?? '対戦記録を自動登録しました');
    const savedDuel = response.data as Duel;

    const deckPayload = buildDeckPayload(resolvedMyDeck, selectedMyDeck.value, myDeckId, false);
    const opponentDeckPayload = buildDeckPayload(
      resolvedOpponentDeck,
      selectedOpponentDeck.value,
      opponentDeckId,
      true,
    );

    emit('saved', {
      duel: { ...savedDuel, deck: deckPayload, opponent_deck: opponentDeckPayload },
      upsertDecks: [deckPayload, opponentDeckPayload],
    });
    saveLastUsedValues({
      myDeckId,
      opponentDeckId,
      rank: form.value.rank,
      gameMode: form.value.game_mode,
    });

    // 次の試合のためにフォームをリセット
    await resetFormForNextDuel();
  } catch (error) {
    logger.error('Failed to auto-register duel');
    notificationStore.error(LL.value?.duels.form.autoRegisterFailed() ?? '自動登録に失敗しました');
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
    const resolvedMyDeck = await resolveDeckId(selectedMyDeck.value, false, myDecksForUser.value);
    const resolvedOpponentDeck = await resolveDeckId(
      selectedOpponentDeck.value,
      true,
      opponentDecksForUser.value,
    );
    const myDeckId = resolvedMyDeck?.id ?? null;
    const opponentDeckId = resolvedOpponentDeck?.id ?? null;

    if (!myDeckId || !opponentDeckId) {
      notificationStore.error(LL.value?.duels.form.deckResolveFailed() ?? 'デッキの登録に失敗しました');
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

    const deckPayload = buildDeckPayload(resolvedMyDeck, selectedMyDeck.value, myDeckId, false);
    const opponentDeckPayload = buildDeckPayload(
      resolvedOpponentDeck,
      selectedOpponentDeck.value,
      opponentDeckId,
      true,
    );

    let savedDuel: Duel;

    if (isEdit.value && props.duel) {
      const response = await api.put(`/duels/${props.duel.id}`, submitData);
      notifyDuelUpdate(); // ポップアップに通知
      notificationStore.success(LL.value?.duels.saveSuccess() ?? '対戦記録を保存しました');
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
      notifyDuelUpdate(); // ポップアップに通知
      notificationStore.success(LL.value?.duels.saveSuccess() ?? '対戦記録を保存しました');
      savedDuel = {
        ...(response.data as Duel),
        ...submitData,
        deck: deckPayload,
        opponent_deck: opponentDeckPayload,
      };
    }

    emit('saved', { duel: savedDuel, upsertDecks: [deckPayload, opponentDeckPayload] });
    saveLastUsedValues({
      myDeckId,
      opponentDeckId,
      rank: form.value.rank,
      gameMode: form.value.game_mode,
    });
    closeDialog();
  } catch (error) {
    logger.error('Failed to save duel');
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

  // タッチターゲットを最低44pxに確保
  :deep(.v-radio) {
    min-height: 44px;
    align-items: center;

    .v-selection-control {
      min-height: 44px;
    }
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

.analysis-description {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 4px;
  border-left: 3px solid rgba(33, 150, 243, 0.5);

  .text-caption {
    color: rgba(128, 128, 128, 0.9);
    line-height: 1.4;
  }
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

      .text-h5, .text-h6 {
        font-size: 1.1rem !important;
      }
    }

    .v-card-text {
      padding: 0 !important;
    }
  }

  .radio-group-wrapper {
    :deep(.v-selection-control-group) {
      gap: 8px;
    }
  }

  // モバイル時のタッチターゲット確保（最低44x44px）
  .screen-analysis-panel {
    :deep(.v-btn) {
      min-height: 44px;
      min-width: 44px;
    }
  }

  .v-card-actions {
    :deep(.v-btn) {
      min-height: 44px;
      min-width: 44px;
    }
  }
}
</style>
