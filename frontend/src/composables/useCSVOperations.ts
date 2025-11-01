/**
 * CSV操作用 Composable
 * CSVのエクスポート・インポート機能
 */

import type { Ref } from 'vue';
import api from '../services/api';
import { useNotificationStore } from '../stores/notification';
import type { GameMode } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('CSVOperations');

interface UseCSVOperationsProps {
  selectedYear: Ref<number>;
  selectedMonth: Ref<number>;
  currentMode: Ref<GameMode>;
  loading: Ref<boolean>;
  fetchDuels: () => Promise<void>;
}

export function useCSVOperations(props: UseCSVOperationsProps) {
  const { selectedYear, selectedMonth, currentMode, loading, fetchDuels } = props;
  const notificationStore = useNotificationStore();

  /**
   * CSVファイルをインポート
   * @param event - ファイル選択イベント
   */
  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    loading.value = true;

    try {
      const response = await api.post('/duels/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // インポート結果を通知
      const data = response.data;
      if (data.created > 0) {
        notificationStore.success(
          `CSVファイルのインポートに成功しました。${data.created}件のデータを追加しました。`,
        );
      }
      if (data.skipped && data.skipped > 0) {
        notificationStore.info(`${data.skipped}件の重複データをスキップしました。`);
      }
      if (data.errors && data.errors.length > 0) {
        notificationStore.warning(
          `${data.errors.length}件のエラーがありました。詳細はコンソールを確認してください。`,
        );
        logger.warn('CSV import errors:', data.errors);
      }

      await fetchDuels();
    } catch (error) {
      logger.error('Failed to import CSV:', error);
      // エラーはAPIインターセプターで処理される
    } finally {
      loading.value = false;
      // Note: inputのクリアは呼び出し側で行う
    }
  };

  /**
   * CSVファイルをエクスポート
   */
  const exportCSV = async () => {
    notificationStore.success('CSVファイルを生成しています... ダウンロードが開始されます。');

    const columns = [
      'deck_name',
      'opponent_deck_name',
      'result',
      'coin',
      'first_or_second',
      'rank',
      'rate_value',
      'dc_value',
      'notes',
      'played_date',
    ];

    try {
      const response = await api.get('/duels/export/csv', {
        params: {
          year: selectedYear.value,
          month: selectedMonth.value,
          game_mode: currentMode.value,
          columns: columns.join(','),
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `duels_${selectedYear.value}_${selectedMonth.value}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error('CSVエクスポートに失敗しました:', error);
      // エラー通知はインターセプターで処理される想定
    }
  };

  return {
    // Functions
    handleFileUpload,
    exportCSV,
  };
}
