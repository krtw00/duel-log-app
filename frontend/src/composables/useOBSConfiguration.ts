/**
 * OBS設定用 Composable
 * OBSオーバーレイのURL生成とドラッグ&ドロップ管理
 */

import { ref, computed } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { createLogger } from '../utils/logger';
import { api } from '../services/api';
import { useLocale } from './useLocale';
import { useGameModes } from './useGameModes';

const logger = createLogger('OBSConfiguration');

export function useOBSConfiguration() {
  const notificationStore = useNotificationStore();
  const { LL } = useLocale();
  const { GAME_MODE_OPTIONS } = useGameModes();

  // OBS設定状態
  const showOBSDialog = ref(false);
  const obsPeriodType = ref<'monthly' | 'recent' | 'from_start'>('from_start');
  const obsYear = ref(new Date().getFullYear());
  const obsMonth = ref(new Date().getMonth() + 1);
  const obsLimit = ref(30);
  const obsGameMode = ref<string>('RANK');
  const obsLayout = ref<'grid' | 'horizontal' | 'vertical'>('grid');
  const obsTheme = ref<'dark' | 'light'>('dark');
  const obsRefreshInterval = ref(30000);
  const urlCopied = ref(false);
  const obsStartId = ref<number | null>(null);

  // OBS専用トークン（バックエンドで発行した短寿命トークン）
  const obsToken = ref<string>('');
  const obsTokenExpiresAt = ref<number>(0);

  // 設定オプション（国際化対応）
  const periodTypeOptions = computed(() => [
    { title: LL.value?.obs.configPanel.periodMonthly() ?? 'Monthly', value: 'monthly' },
    { title: LL.value?.obs.configPanel.periodRecent() ?? 'Recent N matches', value: 'recent' },
    { title: LL.value?.obs.configPanel.periodFromStart() ?? 'From start', value: 'from_start' },
  ]);

  // ゲームモードオプションは共通コンポーザブルから取得
  const gameModeOptions = GAME_MODE_OPTIONS;

  const layoutOptions = computed(() => [
    { title: LL.value?.obs.streamerPopup.layouts.grid() ?? 'Grid', value: 'grid' },
    { title: LL.value?.obs.streamerPopup.layouts.horizontal() ?? 'Horizontal', value: 'horizontal' },
    { title: LL.value?.obs.streamerPopup.layouts.vertical() ?? 'Vertical', value: 'vertical' },
  ]);

  const themeOptions = computed(() => [
    { title: LL.value?.obs.settings.themeDark() ?? 'Dark', value: 'dark' },
    { title: LL.value?.obs.settings.themeLight() ?? 'Light', value: 'light' },
  ]);

  // 年と月の選択肢
  const years = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  });

  const months = computed(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  });

  // コイン勝率の色
  const coinWinRateColor = computed(() => {
    // デフォルトで info を返す（実際の勝率に基づいて変更可能）
    return 'info';
  });

  // 表示項目のキーからラベルを取得
  const getDisplayItemLabel = (key: string): string => {
    const labels: Record<string, () => string | undefined> = {
      current_deck: () => LL.value?.obs.configPanel.items.deck(),
      game_mode_value: () => LL.value?.obs.streamerPopup.items.gameModeValue(),
      total_duels: () => LL.value?.obs.configPanel.items.record(),
      win_rate: () => LL.value?.obs.configPanel.items.winRate(),
      first_turn_win_rate: () => LL.value?.obs.configPanel.items.firstTurnWinRate(),
      second_turn_win_rate: () => LL.value?.obs.configPanel.items.secondTurnWinRate(),
      coin_win_rate: () => LL.value?.obs.configPanel.items.coinTossWinRate(),
      go_first_rate: () => LL.value?.obs.configPanel.items.goFirstRate(),
    };
    return labels[key]?.() ?? key;
  };

  // 表示項目（選択状態のみ保持、ラベルは動的に更新）
  const displayItemsState = ref([
    { value: 'current_deck', selected: true },
    { value: 'game_mode_value', selected: true },
    { value: 'total_duels', selected: false },
    { value: 'win_rate', selected: true },
    { value: 'first_turn_win_rate', selected: true },
    { value: 'second_turn_win_rate', selected: true },
    { value: 'coin_win_rate', selected: true },
    { value: 'go_first_rate', selected: true },
  ]);

  // 表示項目（ラベルを動的に取得）
  const displayItems = computed({
    get: () =>
      displayItemsState.value.map((item) => ({
        label: getDisplayItemLabel(item.value),
        value: item.value,
        selected: item.selected,
      })),
    set: (newItems) => {
      displayItemsState.value = newItems.map((item) => ({
        value: item.value,
        selected: item.selected,
      }));
    },
  });

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
        return LL.value?.obs.configPanel.recommendedSizeHorizontal() ?? 'Recommended: 1920px width, 200px height';
      case 'vertical':
        return LL.value?.obs.configPanel.recommendedSizeVertical() ?? 'Recommended: 250px width, 1080px height';
      case 'grid':
      default:
        return LL.value?.obs.configPanel.recommendedSizeGrid() ?? 'Recommended: 800px width, 600px height';
    }
  });

  /**
   * 最新の対戦記録IDを取得
   */
  const fetchLatestDuelId = async () => {
    try {
      const response = await api.get('/duels/', {
        params: {
          limit: 1,
          offset: 0,
        },
      });
      if (response.data && response.data.length > 0) {
        obsStartId.value = response.data[0].id;
        logger.log('Latest duel ID:', obsStartId.value);
      }
    } catch (error) {
      logger.error('Failed to fetch latest duel ID:', error);
      // エラーが発生しても処理は継続
    }
  };

  /**
   * OBSオーバーレイURL
   */
  const obsUrl = computed(() => {
    const baseUrl = window.location.origin;
    const token = obsToken.value;

    const params = new URLSearchParams({
      token,
      period_type: obsPeriodType.value,
      refresh: obsRefreshInterval.value.toString(),
    });

    // 集計期間に応じたパラメータ追加
    if (obsPeriodType.value === 'monthly') {
      params.append('year', obsYear.value.toString());
      params.append('month', obsMonth.value.toString());
    } else if (obsPeriodType.value === 'recent') {
      params.append('limit', obsLimit.value.toString());
    } else if (obsPeriodType.value === 'from_start') {
      // 配信開始からの場合、start_idが必須
      if (obsStartId.value !== null) {
        params.append('start_id', obsStartId.value.toString());
      }
    }

    // ゲームモード（必須）
    params.append('game_mode', obsGameMode.value);

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

    // テーマ
    params.append('theme', obsTheme.value);

    const url = `${baseUrl}/obs-overlay?${params.toString()}`;
    logger.log('Generated URL (without token):', url.replace(/token=[^&]*/, 'token=***'));

    return url;
  });

  const fetchObsToken = async () => {
    const now = Date.now();
    if (obsToken.value && obsTokenExpiresAt.value > now) {
      return;
    }

    try {
      const response = await api.post('/auth/obs-token');
      const newToken: string | undefined = response.data?.obs_token;
      const expiresIn: number | undefined = response.data?.expires_in;

      if (!newToken || typeof newToken !== 'string') {
        throw new Error('トークンの取得に失敗しました');
      }

      obsToken.value = newToken;
      obsTokenExpiresAt.value =
        typeof expiresIn === 'number' ? now + expiresIn * 1000 - 30_000 : now + 23 * 60 * 60 * 1000;
    } catch (error) {
      logger.error('Failed to fetch OBS token:', error);
      notificationStore.error(LL.value?.obs.configPanel.tokenFetchError() ?? 'Failed to fetch OBS token');
      throw error;
    }
  };

  /**
   * OBS URLをクリップボードにコピー
   */
  const copyOBSUrl = async () => {
    try {
      await fetchObsToken();
      await navigator.clipboard.writeText(obsUrl.value);
      urlCopied.value = true;
      notificationStore.success(LL.value?.obs.configPanel.urlCopySuccess() ?? 'URL copied');
      setTimeout(() => {
        urlCopied.value = false;
      }, 2000);
    } catch (error) {
      notificationStore.error(LL.value?.obs.configPanel.urlCopyError() ?? 'Failed to copy URL');
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
    obsTheme,
    obsRefreshInterval,
    displayItems,
    draggedIndex,
    dragOverIndex,
    urlCopied,
    obsStartId,

    // Constants
    periodTypeOptions,
    gameModeOptions,
    layoutOptions,
    themeOptions,

    // Computed
    years,
    months,
    coinWinRateColor,
    recommendedSizeText,
    obsUrl,

    // Functions
    fetchObsToken,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    copyOBSUrl,
    fetchLatestDuelId,
  };
}
