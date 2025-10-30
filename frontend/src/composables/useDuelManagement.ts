/**
 * デュエル管理用 Composable
 * デュエルの追加・編集・削除機能
 */

import { ref, type Ref } from 'vue';
import api from '../services/api';
import { useNotificationStore } from '../stores/notification';
import type { Duel, Deck } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('DuelManagement');

interface UseDuelManagementProps {
  duels: Ref<Duel[]>;
  fetchDuels: () => Promise<void>;
}

export function useDuelManagement(props: UseDuelManagementProps) {
  const { duels, fetchDuels } = props;
  const notificationStore = useNotificationStore();

  const selectedDuel = ref<Duel | null>(null);
  const dialogOpen = ref(false);

  /**
   * 新規デュエル追加ダイアログを開く
   */
  const openDuelDialog = () => {
    selectedDuel.value = null;
    dialogOpen.value = true;
  };

  /**
   * デュエル編集ダイアログを開く
   * @param duel - 編集するデュエル
   */
  const editDuel = (duel: Duel) => {
    selectedDuel.value = duel;
    dialogOpen.value = true;
  };

  /**
   * デュエルを削除
   * @param duelId - 削除するデュエルのID
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
   * デュエル保存後のハンドラー
   */
  const handleSaved = () => {
    dialogOpen.value = false;
    fetchDuels();
  };

  return {
    // State
    duels,
    selectedDuel,
    dialogOpen,

    // Functions
    openDuelDialog,
    editDuel,
    deleteDuel,
    handleSaved,
  };
}
