/**
 * デュエル管理用 Composable
 *
 * @description
 * 対戦記録（Duel）の追加・編集・削除機能を提供します。
 * DashboardViewで使用され、対戦記録の CRUD 操作を一元管理します。
 *
 * @remarks
 * このComposableは以下の機能を提供します：
 * - 新規対戦記録の追加ダイアログ表示
 * - 既存対戦記録の編集ダイアログ表示
 * - 対戦記録の削除（確認ダイアログ付き）
 * - ダイアログの開閉状態管理
 * - 保存後のデータ再取得
 *
 * API通信やエラーハンドリングも内包しており、
 * 呼び出し側は返されたメソッドを実行するだけで完結します。
 *
 * @example
 * ```typescript
 * import { ref } from 'vue';
 * import { useDuelManagement } from '@/composables/useDuelManagement';
 *
 * const duels = ref<Duel[]>([]);
 * const decks = ref<Deck[]>([]);
 *
 * const fetchDuels = async () => {
 *   const response = await api.get('/duels/');
 *   duels.value = response.data;
 * };
 *
 * const {
 *   dialogOpen,
 *   selectedDuel,
 *   openDuelDialog,
 *   editDuel,
 *   deleteDuel,
 *   handleSaved
 * } = useDuelManagement({ duels, decks, fetchDuels });
 *
 * // 新規追加ダイアログを開く
 * openDuelDialog();
 *
 * // 編集ダイアログを開く
 * editDuel(duels.value[0]);
 *
 * // 削除
 * await deleteDuel(123);
 * ```
 */

import { ref, type Ref } from 'vue';
import api from '../services/api';
import { useNotificationStore } from '../stores/notification';
import type { Duel, Deck } from '../types';
import { createLogger } from '../utils/logger';

// ログ出力用のロガーを作成
const logger = createLogger('DuelManagement');

/**
 * useDuelManagement の入力プロパティ
 *
 * @property {Ref<Duel[]>} duels - 対戦記録のリスト（親コンポーネントから渡される）
 * @property {Ref<Deck[]>} decks - デッキのリスト（フォームで使用）
 * @property {() => Promise<void>} fetchDuels - 対戦記録を再取得する関数（保存/削除後に呼ばれる）
 */
interface UseDuelManagementProps {
  duels: Ref<Duel[]>;
  decks: Ref<Deck[]>;
  fetchDuels: () => Promise<void>;
}

export function useDuelManagement(props: UseDuelManagementProps) {
  const { duels, decks, fetchDuels } = props;
  // 通知表示用のストア
  const notificationStore = useNotificationStore();

  /**
   * 編集対象の対戦記録
   *
   * @remarks
   * - `null` の場合: 新規追加モード
   * - 値がある場合: 編集モード
   *
   * DuelFormDialogコンポーネントがこの値を監視し、
   * 編集モード時はフォームに既存データを表示します。
   */
  const selectedDuel = ref<Duel | null>(null);

  /**
   * ダイアログの開閉状態
   *
   * @remarks
   * `true`: ダイアログ表示中
   * `false`: ダイアログ非表示
   *
   * 保存成功時やキャンセル時に `false` に設定されます。
   */
  const dialogOpen = ref(false);

  /**
   * 新規対戦記録追加ダイアログを開く
   *
   * @remarks
   * `selectedDuel` を `null` に設定することで、
   * フォームが新規追加モードで開きます。
   * 空のフォームが表示され、全フィールドの入力が必要です。
   *
   * @example
   * ```typescript
   * <v-btn @click="openDuelDialog">新規追加</v-btn>
   * ```
   */
  const openDuelDialog = () => {
    selectedDuel.value = null;
    dialogOpen.value = true;
  };

  /**
   * 対戦記録編集ダイアログを開く
   *
   * @param {Duel} duel - 編集する対戦記録オブジェクト
   *
   * @remarks
   * `selectedDuel` に対戦記録を設定することで、
   * フォームが編集モードで開きます。
   * フォームには既存のデータが入力された状態で表示されます。
   *
   * 編集モードでは、対戦記録のIDを使用してPUTリクエストが送信されます。
   *
   * @example
   * ```typescript
   * <v-btn @click="editDuel(duel)">編集</v-btn>
   * ```
   */
  const editDuel = (duel: Duel) => {
    selectedDuel.value = duel;
    dialogOpen.value = true;
  };

  /**
   * 対戦記録を削除
   *
   * @param {number} duelId - 削除する対戦記録のID
   *
   * @remarks
   * 削除実行前に確認ダイアログ（`window.confirm`）を表示します。
   * ユーザーがキャンセルした場合は何もしません。
   *
   * 削除成功時:
   * - 成功通知を表示
   * - 対戦記録を再取得（`fetchDuels`を呼び出し）
   * - UIから該当の対戦記録が消える
   *
   * 削除失敗時:
   * - エラーログを出力
   * - エラー通知はAPIインターセプターで自動表示
   *
   * @example
   * ```typescript
   * <v-btn @click="deleteDuel(duel.id)" color="error">削除</v-btn>
   * ```
   */
  const deleteDuel = async (duelId: number) => {
    if (!confirm('この対戦記録を削除しますか？')) return;

    try {
      await api.delete(`/duels/${duelId}`);
      notificationStore.success('対戦記録を削除しました。');
      await fetchDuels();
    } catch (error) {
      logger.error('Failed to delete duel:', error);
    }
  };

  /**
   * 対戦記録保存後のハンドラー
   *
   * @remarks
   * DuelFormDialogコンポーネントから、保存成功時に呼び出されます。
   *
   * 実行内容:
   * 1. ダイアログを閉じる（`dialogOpen = false`）
   * 2. 対戦記録を再取得（`fetchDuels`を呼び出し）
   *    - 新規追加の場合: 追加された記録が表示される
   *    - 編集の場合: 更新された内容が表示される
   *
   * 統計データや勝率などもこのタイミングで再計算されます。
   *
   * @example
   * ```typescript
   * <DuelFormDialog
   *   :dialog-open="dialogOpen"
   *   @saved="handleSaved"
   * />
   * ```
   */
  const handleSaved = () => {
    dialogOpen.value = false;
    fetchDuels();
  };

  return {
    // State
    duels,
    decks,
    selectedDuel,
    dialogOpen,

    // Functions
    openDuelDialog,
    editDuel,
    deleteDuel,
    handleSaved,
  };
}
