/**
 * OBS設定用 Composable
 * OBSオーバーレイのURL生成とドラッグ&ドロップ管理
 */

import { ref, computed } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { createLogger } from '../utils/logger';

const logger = createLogger('OBSConfiguration');

export function useOBSConfiguration() {
  const notificationStore = useNotificationStore();

  // OBS設定状態
  const showOBSDialog = ref(false);
  const obsPeriodType = ref<'monthly' | 'recent'>('recent');
  const obsYear = ref(new Date().getFullYear());
  const obsMonth = ref(new Date().getMonth() + 1);
  const obsLimit = ref(30);
  const obsGameMode = ref<string | undefined>(undefined);
  const obsLayout = ref<'grid' | 'horizontal' | 'vertical'>('grid');
  const obsRefreshInterval = ref(30000);
  const urlCopied = ref(false);

  // 設定オプション
  const periodTypeOptions = [
    { title: '月間集計', value: 'monthly' },
    { title: '直近N戦', value: 'recent' },
  ];

  const gameModeOptions = [
    { title: 'ランク', value: 'RANK' },
    { title: 'レート', value: 'RATE' },
    { title: 'イベント', value: 'EVENT' },
    { title: 'DC', value: 'DC' },
  ];

  const layoutOptions = [
    { title: 'グリッド（自動）', value: 'grid' },
    { title: '横1列（右に伸ばす）', value: 'horizontal' },
    { title: '縦1列（下に伸ばす）', value: 'vertical' },
  ];

  // 表示項目
  const displayItems = ref([
    { label: '使用デッキ', value: 'current_deck', selected: true },
    { label: 'ランク', value: 'current_rank', selected: true },
    { label: '総試合数', value: 'total_duels', selected: false },
    { label: '勝率', value: 'win_rate', selected: true },
    { label: '先行勝率', value: 'first_turn_win_rate', selected: true },
    { label: '後攻勝率', value: 'second_turn_win_rate', selected: true },
    { label: 'コイン勝率', value: 'coin_win_rate', selected: true },
    { label: '先行率', value: 'go_first_rate', selected: true },
  ]);

  // ドラッグ&ドロップの状態管理
  const draggedIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);

  /**
   * ドラッグ開始
   */
  const handleDragStart = (index: number) => {
    draggedIndex.value = index;
  };

  /**
   * ドラッグオーバー
   */
  const handleDragOver = (index: number) => {
    if (draggedIndex.value === null || draggedIndex.value === index) return;
    dragOverIndex.value = index;
  };

  /**
   * ドラッグエンター
   */
  const handleDragEnter = (index: number) => {
    dragOverIndex.value = index;
  };

  /**
   * ドラッグリーブ
   */
  const handleDragLeave = () => {
    dragOverIndex.value = null;
  };

  /**
   * ドロップ
   */
  const handleDrop = (index: number) => {
    if (draggedIndex.value === null || draggedIndex.value === index) return;

    const items = [...displayItems.value];
    const draggedItem = items[draggedIndex.value];
    items.splice(draggedIndex.value, 1);
    items.splice(index, 0, draggedItem);
    displayItems.value = items;

    draggedIndex.value = null;
    dragOverIndex.value = null;
  };

  /**
   * ドラッグ終了
   */
  const handleDragEnd = () => {
    draggedIndex.value = null;
    dragOverIndex.value = null;
  };

  /**
   * レイアウトに応じた推奨サイズテキスト
   */
  const recommendedSizeText = computed(() => {
    switch (obsLayout.value) {
      case 'horizontal':
        return '幅: 1920px、高さ: 200px を推奨（下部に配置）';
      case 'vertical':
        return '幅: 250px、高さ: 1080px を推奨（右端に配置）';
      case 'grid':
      default:
        return '幅: 800px、高さ: 600px を推奨';
    }
  });

  /**
   * OBSオーバーレイURL
   */
  const obsUrl = computed(() => {
    const baseUrl = window.location.origin;
    // localStorageから直接トークンを取得
    const accessToken = localStorage.getItem('access_token') || '';

    logger.log('Generating OBS URL');
    logger.log('Access token exists:', !!accessToken);
    logger.log('Token length:', accessToken.length);
    if (accessToken) {
      logger.log('Token preview:', accessToken.substring(0, 20) + '...');
    }

    const params = new URLSearchParams({
      token: accessToken,
      period_type: obsPeriodType.value,
      refresh: obsRefreshInterval.value.toString(),
    });

    // 集計期間に応じたパラメータ追加
    if (obsPeriodType.value === 'monthly') {
      params.append('year', obsYear.value.toString());
      params.append('month', obsMonth.value.toString());
    } else if (obsPeriodType.value === 'recent') {
      params.append('limit', obsLimit.value.toString());
    }

    // ゲームモード
    if (obsGameMode.value) {
      params.append('game_mode', obsGameMode.value);
    }

    // 表示項目
    const selectedItems = displayItems.value
      .filter((item) => item.selected)
      .map((item) => item.value)
      .join(',');
    if (selectedItems) {
      params.append('display_items', selectedItems);
    }

    // レイアウト
    params.append('layout', obsLayout.value);

    const url = `${baseUrl}/obs-overlay?${params.toString()}`;
    logger.log('Generated URL (without token):', url.replace(/token=[^&]*/, 'token=***'));

    return url;
  });

  /**
   * OBS URLをクリップボードにコピー
   */
  const copyOBSUrl = async () => {
    try {
      await navigator.clipboard.writeText(obsUrl.value);
      urlCopied.value = true;
      notificationStore.success('URLをコピーしました');
      setTimeout(() => {
        urlCopied.value = false;
      }, 2000);
    } catch (error) {
      notificationStore.error('URLのコピーに失敗しました');
    }
  };

  return {
    // State
    showOBSDialog,
    obsPeriodType,
    obsYear,
    obsMonth,
    obsLimit,
    obsGameMode,
    obsLayout,
    obsRefreshInterval,
    displayItems,
    draggedIndex,
    dragOverIndex,
    urlCopied,

    // Constants
    periodTypeOptions,
    gameModeOptions,
    layoutOptions,

    // Computed
    recommendedSizeText,
    obsUrl,

    // Functions
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    copyOBSUrl,
  };
}
