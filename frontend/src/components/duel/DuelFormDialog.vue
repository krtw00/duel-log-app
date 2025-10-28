<!--
/**
 * DuelFormDialog.vue
 *
 * 対戦記録の新規作成・編集ダイアログコンポーネント
 *
 * 機能:
 * - 対戦記録の新規登録と編集（モーダルダイアログ形式）
 * - ゲームモード別（RANK/RATE/EVENT/DC）の入力フォーム
 * - デッキ選択（comboboxで既存選択 or 新規入力可能）
 * - 勝敗、コイントス結果、先攻/後攻の記録
 * - ゲームモード固有の値（ランク/レート/DCポイント）の入力
 * - 対戦日時の自動設定（新規時）または手動変更（編集時）
 * - バリデーション付きフォーム送信
 *
 * データフロー:
 * 1. ダイアログオープン時:
 *    - デッキ一覧を取得（編集時はアーカイブ済みも含む）
 *    - 新規作成時: デフォルト値と最新値を適用
 *    - 編集時: 既存の対戦記録データをフォームに設定
 * 2. ゲームモード変更時:
 *    - 該当モードの最新値（ランク/レート/DC）を自動入力
 *    - よく使うデッキを自動選択
 * 3. 送信時:
 *    - バリデーション実行
 *    - デッキIDを解決（新規デッキの場合は自動作成）
 *    - 日時をISO形式に変換してAPI送信
 *    - 成功時: 'saved'イベント発火 → 親コンポーネントでデータ再取得
 *
 * 状態管理:
 * - form: 対戦記録の入力データ（DuelCreate型）
 * - selectedMyDeck/selectedOpponentDeck: comboboxで選択中のデッキ
 * - myDecks/opponentDecks: デッキ選択肢一覧
 * - isEdit: 編集モードか新規作成モードかを判定
 *
 * Composables:
 * - useDuelFormValidation: フォームバリデーションルール
 * - useDateTimeFormat: 日時形式の変換（ISO ⇔ datetime-local）
 * - useDeckResolution: デッキIDの解決と新規作成
 * - useLatestDuelValues: 最新の対戦記録から値を取得・適用
 */
-->
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
              <div class="radio-group-wrapper">
                <label class="radio-label">
                  <v-icon class="mr-2" size="small">mdi-poker-chip</v-icon>
                  コイン
                </label>
                <v-radio-group
                  v-model="form.coin"
                  inline
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="表" :value="true"></v-radio>
                  <v-radio label="裏" :value="false"></v-radio>
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
                  v-model="form.first_or_second"
                  inline
                  color="primary"
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="先攻" :value="true"></v-radio>
                  <v-radio label="後攻" :value="false"></v-radio>
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
                  v-model="form.result"
                  inline
                  :rules="[rules.required]"
                  hide-details="auto"
                >
                  <v-radio label="勝ち" :value="true" color="success"></v-radio>
                  <v-radio label="負け" :value="false" color="error"></v-radio>
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
}

const props = withDefaults(defineProps<Props>(), {
  defaultGameMode: 'RANK',
});
const emit = defineEmits(['update:modelValue', 'saved']);

const notificationStore = useNotificationStore();
const { rules } = useDuelFormValidation();
const { getCurrentLocalDateTime, localDateTimeToISO, isoToLocalDateTime } = useDateTimeFormat();
const { resolveDeckId } = useDeckResolution();
const { fetchLatestValues, applyLatestValuesToGameMode } = useLatestDuelValues();

const formRef = ref();
const loading = ref(false);
const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);

// コンボボックス用の選択値
// 型: Deck（既存デッキから選択）| string（新しいデッキ名を入力）| null
const selectedMyDeck = ref<Deck | string | null>(null);
const selectedOpponentDeck = ref<Deck | string | null>(null);

/**
 * デフォルトのフォーム値を生成
 *
 * 新規作成時の初期値として使用します。
 * - 勝敗、コイン、先攻/後攻はデフォルトでtrue（勝ち、表、先攻）
 * - 対戦日時は現在時刻
 * - ゲームモード固有の値（rank/rate_value/dc_value）はundefined
 */
const defaultForm = (): DuelCreate => {
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
    played_date: getCurrentLocalDateTime(),
    notes: '',
  };
};

const form = ref<DuelCreate>(defaultForm());

// 編集モードか新規作成モードかを判定
// props.duelがあれば編集、なければ新規作成
const isEdit = computed(() => !!props.duel);

/**
 * デッキ一覧を取得
 *
 * プレイヤーのデッキと相手のデッキを並列で取得します。
 * 編集モード時はアーカイブ済み（削除済み）のデッキも含めて取得します。
 * これにより、過去の対戦記録で使用した削除済みデッキも選択可能になります。
 */
const fetchDecks = async () => {
  try {
    // 編集モードの場合はアーカイブされたデッキも含める
    const activeOnly = !isEdit.value;
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

/**
 * ダイアログのオープン/クローズを監視
 *
 * ダイアログが開かれた時の処理:
 * 1. デッキ一覧を取得
 * 2. 編集モード時:
 *    - 既存の対戦記録データをフォームに設定
 *    - ISO形式の日時をdatetime-local形式に変換
 *    - 選択されたデッキオブジェクトをcomboboxにセット
 * 3. 新規作成モード時:
 *    - 最新の対戦記録から値を取得（ランク/レート/DC、デッキ）
 *    - デフォルトフォーム値を設定
 *    - propsで指定されたゲームモードを適用
 *    - ゲームモードに応じた最新値を自動入力
 */
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

        // ゲームモードに応じた最新値を適用
        const applied = applyLatestValuesToGameMode(form.value.game_mode, myDecks.value);
        form.value.rank = applied.rank;
        form.value.rate_value = applied.rate_value;
        form.value.dc_value = applied.dc_value;
        selectedMyDeck.value = applied.selectedMyDeck;
        selectedOpponentDeck.value = applied.selectedOpponentDeck;
      }
    }
  },
);

/**
 * ゲームモード変更を監視
 *
 * ゲームモードが変更された時（新規作成時のみ）:
 * 1. 現在のゲームモード固有の値をクリア
 * 2. 新しいゲームモードに応じた最新値を適用
 *    - RANK: 最新のランクとよく使うデッキ
 *    - RATE: 最新のレート値とよく使うデッキ
 *    - DC: 最新のDCポイントとよく使うデッキ
 *    - EVENT: デッキのみ（固有値なし）
 *
 * Note: 編集モード時は既存データを保持するため、この処理をスキップ
 */
watch(
  () => form.value.game_mode,
  (newMode) => {
    // 編集モードでは値を変更しない
    if (isEdit.value) return;

    // 現在のゲームモード固有の値をクリア
    form.value.rank = undefined;
    form.value.rate_value = undefined;
    form.value.dc_value = undefined;

    // ゲームモードに応じた最新値を適用
    const applied = applyLatestValuesToGameMode(newMode, myDecks.value);
    form.value.rank = applied.rank;
    form.value.rate_value = applied.rate_value;
    form.value.dc_value = applied.dc_value;
    selectedMyDeck.value = applied.selectedMyDeck;
    selectedOpponentDeck.value = applied.selectedOpponentDeck;
  },
);

/**
 * フォーム送信処理
 *
 * 処理フロー:
 * 1. バリデーション実行（必須項目、数値範囲などをチェック）
 * 2. デッキIDの解決:
 *    - 既存デッキが選択された場合: そのIDを使用
 *    - 新しいデッキ名が入力された場合: 自動的に新規デッキを作成してIDを取得
 * 3. 日時の処理:
 *    - 新規作成時: 現在時刻を自動設定
 *    - 編集時: ユーザーが指定した日時を使用
 *    - datetime-local形式からISO文字列に変換（APIに送信）
 * 4. API送信:
 *    - 編集モード: PUT /duels/{id}
 *    - 新規作成: POST /duels/
 * 5. 成功時:
 *    - 通知表示
 *    - 'saved'イベント発火（親コンポーネントでデータ再取得）
 *    - ダイアログを閉じる
 */
const handleSubmit = async () => {
  // バリデーション実行
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // デッキIDを解決（必要に応じて新規作成）
    // resolveDeckIdは既存デッキのIDを返すか、新規デッキを作成してそのIDを返す
    const myDeckId = await resolveDeckId(selectedMyDeck.value, false, myDecks.value);
    const opponentDeckId = await resolveDeckId(selectedOpponentDeck.value, true, opponentDecks.value);

    if (!myDeckId || !opponentDeckId) {
      notificationStore.error('デッキの登録に失敗しました');
      loading.value = false;
      return;
    }

    // 新規登録時は現在時刻を自動設定（対戦直後の記録を想定）
    if (!isEdit.value) {
      form.value.played_date = getCurrentLocalDateTime();
    }

    // datetime-local形式（'YYYY-MM-DDTHH:mm'）をISO文字列に変換
    // ローカルタイムゾーンを保持してバックエンドに送信
    const submitData = {
      ...form.value,
      deck_id: myDeckId,
      opponentDeck_id: opponentDeckId,
      played_date: localDateTimeToISO(form.value.played_date),
    };

    // 編集または新規作成
    if (isEdit.value && props.duel) {
      await api.put(`/duels/${props.duel.id}`, submitData);
      notificationStore.success('対戦記録を更新しました');
    } else {
      await api.post('/duels/', submitData);
      notificationStore.success('対戦記録を登録しました');
    }

    // 親コンポーネントに保存完了を通知（データ再取得のトリガー）
    emit('saved');
    closeDialog();
  } catch (error) {
    console.error('Failed to save duel:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * ダイアログを閉じる
 *
 * ダイアログを閉じる際のクリーンアップ処理:
 * - v-dialogのmodelValueをfalseに設定（ダイアログを非表示）
 * - バリデーションエラーをリセット
 * - 選択中のデッキをクリア（次回オープン時のため）
 */
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
