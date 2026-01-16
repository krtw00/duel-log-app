<template>
  <div ref="popupContainer" class="streamer-popup" :class="['theme-' + theme, chromaKeyClass]">
    <!-- ローディング中 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text">{{ LL?.common.loading() }}</div>
    </div>

    <!-- 未認証 -->
    <div v-else-if="!isAuthenticated" class="error-container">
      <div class="error-text">{{ LL?.obs.streamerPopup.loginRequired() }}</div>
      <div class="error-detail">{{ LL?.obs.streamerPopup.loginRequiredDetail() }}</div>
    </div>

    <!-- エラー -->
    <div v-else-if="errorMessage" class="error-container">
      <div class="error-text">{{ errorMessage }}</div>
    </div>

    <!-- データ表示（空データでも表示） -->
    <div v-else ref="statsContainer" class="stats-container">
      <!-- 統計カード -->
      <div v-if="showStats" class="stats-card" :class="`layout-${layout}`">
        <div
          v-for="item in statsItems"
          :key="item.key"
          class="stat-item"
          :class="{ 'deck-item': item.key === 'current_deck' }"
        >
          <div class="stat-icon-wrapper">
            <span class="mdi" :class="item.icon"></span>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :class="{ 'deck-value': item.key === 'current_deck' }">
              {{ item.format(statsData[item.key]) }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/services/api';
import { createLogger } from '@/utils/logger';
import { useAuthStore } from '@/stores/auth';
import { useLocale } from '@/composables/useLocale';
import { useRanks } from '@/composables/useRanks';
import type { GameMode } from '@/types';

const logger = createLogger('StreamerPopup');

const route = useRoute();
const authStore = useAuthStore();
const { LL } = useLocale();
const { getRankName } = useRanks();
const loading = ref(true);
const errorMessage = ref<string>('');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// DOM参照
const popupContainer = ref<HTMLElement | null>(null);
const statsContainer = ref<HTMLElement | null>(null);

// クエリパラメータから設定を取得
const itemsParam = ref((route.query.items as string) || 'win_rate,total_duels');
const theme = ref((route.query.theme as string) || 'dark');
const layout = ref((route.query.layout as string) || 'horizontal');
const refreshInterval = ref(Number(route.query.refresh) || 30000);
const gameMode = ref<GameMode>((route.query.game_mode as GameMode) || 'RANK');
const statsPeriod = ref((route.query.stats_period as string) || 'monthly');

// データ
const statsData = ref<Record<string, unknown>>({});

// セッション統計用: 起動時の統計を保存
interface InitialStats {
  total: number;
  wins: number;
  first_turn_wins: number;
  first_turn_total: number;
  second_turn_wins: number;
  second_turn_total: number;
  coin_wins: number;
  coin_total: number;
}
const initialStats = ref<InitialStats | null>(null);

// 初回リサイズ済みフラグ（自動更新時にサイズが変わるのを防ぐ）
const hasResized = ref(false);

// 認証状態
const isAuthenticated = computed(() => authStore.isAuthenticated);

// クロマキー背景のCSSクラス
const chromaKeyClass = computed(() => {
  switch (authStore.chromaKeyBackground) {
    case 'green':
      return 'chroma-key-green';
    case 'blue':
      return 'chroma-key-blue';
    default:
      return '';
  }
});

// 表示項目の設定
const selectedItems = computed(() => itemsParam.value.split(',').filter(Boolean));
const showStats = computed(() => selectedItems.value.length > 0);

// ランクマップ（翻訳から取得）
const getRankTierLabel = (tier: string): string | undefined => {
  const tierMap: Record<string, () => string | undefined> = {
    BEGINNER: () => LL.value?.obs.ranks.beginner(),
    BRONZE: () => LL.value?.obs.ranks.bronze(),
    SILVER: () => LL.value?.obs.ranks.silver(),
    GOLD: () => LL.value?.obs.ranks.gold(),
    PLATINUM: () => LL.value?.obs.ranks.platinum(),
    DIAMOND: () => LL.value?.obs.ranks.diamond(),
    MASTER: () => LL.value?.obs.ranks.master(),
  };
  return tierMap[tier]?.();
};

// フォーマット関数
const normalizeNumericValue = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const num = Number(trimmed);
    return Number.isNaN(num) ? null : num;
  }
  return null;
};

const formatDecimalValue = (value: unknown, fractionDigits = 2): string => {
  const numeric = normalizeNumericValue(value);
  return numeric === null ? '-' : numeric.toFixed(fractionDigits);
};

const formatPercentageValue = (value: unknown, fractionDigits = 1): string => {
  const numeric = normalizeNumericValue(value);
  if (numeric === null) return '-';
  const percentage = numeric <= 1 ? numeric * 100 : numeric;
  return `${percentage.toFixed(fractionDigits)}%`;
};

const formatIntegerValue = (value: unknown): string => {
  const numeric = normalizeNumericValue(value);
  return numeric === null ? '0' : Math.round(numeric).toString();
};

const formatRankValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim().toUpperCase();
    const match = /^([A-Z]+)[ _-]?([0-9]+)$/.exec(trimmed);
    if (match) {
      const [, tier, stage] = match;
      const tierLabel = getRankTierLabel(tier);
      if (tierLabel) return `${tierLabel}${stage}`;
    }
    const numericFromString = normalizeNumericValue(trimmed);
    if (numericFromString !== null) return getRankName(numericFromString);
    return trimmed;
  }
  const numeric = normalizeNumericValue(value);
  return numeric !== null ? getRankName(numeric) : '-';
};

// 表示項目定義
/**
 *
 */
interface DisplayItemDef {
  key: string;
  label: string;
  icon: string;
  format: (v: unknown) => string;
}

const allDisplayItems = computed<DisplayItemDef[]>(() => [
  {
    key: 'current_deck',
    label: LL.value?.obs.streamerPopup.items.currentDeck() ?? 'Current Deck',
    icon: 'mdi-cards-playing-outline',
    format: (v) => (v as string | undefined) || (LL.value?.obs.streamerPopup.items.notSet() ?? 'Not Set'),
  },
  { key: 'total_duels', label: LL.value?.obs.streamerPopup.items.totalDuels() ?? 'Total Matches', icon: 'mdi-sword-cross', format: formatIntegerValue },
  { key: 'win_rate', label: LL.value?.obs.streamerPopup.items.winRate() ?? 'Win Rate', icon: 'mdi-trophy', format: (v) => formatPercentageValue(v) },
  { key: 'first_turn_win_rate', label: LL.value?.obs.streamerPopup.items.firstTurnWinRate() ?? 'Going First Win Rate', icon: 'mdi-lightning-bolt', format: (v) => formatPercentageValue(v) },
  { key: 'second_turn_win_rate', label: LL.value?.obs.streamerPopup.items.secondTurnWinRate() ?? 'Going Second Win Rate', icon: 'mdi-shield', format: (v) => formatPercentageValue(v) },
  { key: 'coin_win_rate', label: LL.value?.obs.streamerPopup.items.coinWinRate() ?? 'Coin Win Rate', icon: 'mdi-poker-chip', format: (v) => formatPercentageValue(v) },
  { key: 'go_first_rate', label: LL.value?.obs.streamerPopup.items.goFirstRate() ?? 'Going First Rate', icon: 'mdi-arrow-up-bold-hexagon-outline', format: (v) => formatPercentageValue(v) },
]);

// ゲームモードに応じた値の設定を取得
const getGameModeValueConfig = (mode: GameMode): { key: string; label: string; icon: string; format: (v: unknown) => string } | null => {
  switch (mode) {
    case 'RANK':
      return { key: 'current_rank', label: LL.value?.obs.streamerPopup.items.rank() ?? 'Rank', icon: 'mdi-crown', format: formatRankValue };
    case 'RATE':
      return { key: 'current_rate', label: LL.value?.obs.streamerPopup.items.rate() ?? 'Rate', icon: 'mdi-chart-line', format: (v) => formatDecimalValue(v) };
    case 'DC':
      return { key: 'current_dc', label: LL.value?.obs.streamerPopup.items.dc() ?? 'DC', icon: 'mdi-medal', format: (v) => formatDecimalValue(v) };
    case 'EVENT':
      return null; // EVENTモードでは表示しない
    default:
      return null;
  }
};

const statsItems = computed(() => {
  const items: DisplayItemDef[] = [];

  for (const key of selectedItems.value) {
    if (key === 'game_mode_value') {
      // ゲームモードに応じた値を追加
      const config = getGameModeValueConfig(gameMode.value);
      if (config) {
        items.push(config);
      }
    } else {
      const item = allDisplayItems.value.find((item) => item.key === key);
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
});

/**
 * ウィンドウサイズをコンテンツに合わせて自動調整（初回のみ）
 */
const resizeWindowToContent = async () => {
  // 既にリサイズ済みの場合はスキップ（自動更新時にサイズが変わるのを防ぐ）
  if (hasResized.value) return;

  // ポップアップウィンドウでない場合はスキップ
  if (!window.opener) return;

  await nextTick();

  // コンテンツのサイズを取得
  const container = statsContainer.value || popupContainer.value;
  if (!container) return;

  // コンテンツの実際のサイズを測定（scrollWidth/scrollHeightでオーバーフロー含む）
  const contentWidth = Math.max(container.scrollWidth, container.offsetWidth);
  const contentHeight = Math.max(container.scrollHeight, container.offsetHeight);

  // パディングとマージンを考慮
  const horizontalPadding = 80;
  const verticalPadding = 120;

  // レイアウトに応じたサイズ制限
  let minWidth: number;
  let maxWidth: number;
  let minHeight: number;
  let maxHeight: number;

  if (layout.value === 'horizontal') {
    // 横並び: 幅を広く、高さは最小限
    minWidth = 400;
    maxWidth = 2400; // 1行に収めるため広めに
    minHeight = 100;
    maxHeight = 300;
  } else if (layout.value === 'vertical') {
    // 縦並び: 幅は狭く、高さを確保
    minWidth = 180;
    maxWidth = 280;
    minHeight = 200;
    maxHeight = 1200;
  } else {
    // グリッド: デフォルト
    minWidth = 350;
    maxWidth = 1200;
    minHeight = 150;
    maxHeight = 900;
  }

  // ウィンドウサイズを計算（ブラウザのUIを考慮）
  const targetWidth = Math.min(maxWidth, Math.max(minWidth, contentWidth + horizontalPadding));
  const targetHeight = Math.min(maxHeight, Math.max(minHeight, contentHeight + verticalPadding));

  try {
    window.resizeTo(targetWidth, targetHeight);
    hasResized.value = true; // リサイズ済みフラグを立てる
    logger.debug(`Window resized to ${targetWidth}x${targetHeight} (layout: ${layout.value})`);
  } catch (e) {
    logger.debug('Could not resize window:', e);
  }
};

/**
 * セッション統計を計算する
 * 現在の統計から起動時の統計を引いて、セッション中の統計を計算
 */
const calculateSessionStats = (current: InitialStats): Record<string, number> => {
  if (!initialStats.value) {
    return {
      total_duels: 0,
      win_rate: 0,
      first_turn_win_rate: 0,
      second_turn_win_rate: 0,
      coin_win_rate: 0,
      go_first_rate: 0,
    };
  }

  const initial = initialStats.value;
  const sessionTotal = current.total - initial.total;
  const sessionWins = current.wins - initial.wins;
  const sessionFirstWins = current.first_turn_wins - initial.first_turn_wins;
  const sessionFirstTotal = current.first_turn_total - initial.first_turn_total;
  const sessionSecondWins = current.second_turn_wins - initial.second_turn_wins;
  const sessionSecondTotal = current.second_turn_total - initial.second_turn_total;
  const sessionCoinWins = current.coin_wins - initial.coin_wins;
  const sessionCoinTotal = current.coin_total - initial.coin_total;

  return {
    total_duels: sessionTotal,
    win_rate: sessionTotal > 0 ? sessionWins / sessionTotal : 0,
    first_turn_win_rate: sessionFirstTotal > 0 ? sessionFirstWins / sessionFirstTotal : 0,
    second_turn_win_rate: sessionSecondTotal > 0 ? sessionSecondWins / sessionSecondTotal : 0,
    coin_win_rate: sessionCoinTotal > 0 ? sessionCoinWins / sessionCoinTotal : 0,
    go_first_rate: sessionTotal > 0 ? sessionFirstTotal / sessionTotal : 0,
  };
};

// データ取得
const fetchData = async () => {
  if (!isAuthenticated.value) {
    loading.value = false;
    return;
  }

  try {
    logger.debug('Fetching streamer popup data');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 統計データを取得
    const statsResponse = await api.get('/statistics', {
      params: {
        year,
        month,
        game_mode: gameMode.value,
      },
    });

    const modeStats = statsResponse.data[gameMode.value];
    if (modeStats) {
      const overall = modeStats.overall_stats || {};
      const duels = modeStats.duels || [];

      // 最新の対戦からデッキとランク/レート/DCを取得
      const latestDuel = duels.length > 0 ? duels[0] : null;

      // 現在の統計を構造化
      const currentStats: InitialStats = {
        total: overall.total || 0,
        wins: overall.wins || 0,
        first_turn_wins: overall.first_turn_wins || 0,
        first_turn_total: overall.first_turn_total || 0,
        second_turn_wins: overall.second_turn_wins || 0,
        second_turn_total: overall.second_turn_total || 0,
        coin_wins: overall.coin_wins || 0,
        coin_total: overall.coin_total || 0,
      };

      // 初回取得時にセッション統計の起点を保存
      if (initialStats.value === null) {
        initialStats.value = { ...currentStats };
        logger.debug('Initial stats saved for session tracking');
      }

      // 統計期間に応じてデータを設定
      if (statsPeriod.value === 'session') {
        // セッション統計: 起動時からの差分を計算
        const sessionStats = calculateSessionStats(currentStats);
        statsData.value = {
          current_deck: latestDuel?.deck?.name || (LL.value?.obs.streamerPopup.items.notSet() ?? 'Not Set'),
          current_rank: latestDuel?.rank || null,
          current_rate: latestDuel?.rate_value || null,
          current_dc: latestDuel?.dc_value || null,
          total_duels: sessionStats.total_duels,
          win_rate: sessionStats.win_rate,
          first_turn_win_rate: sessionStats.first_turn_win_rate,
          second_turn_win_rate: sessionStats.second_turn_win_rate,
          coin_win_rate: sessionStats.coin_win_rate,
          go_first_rate: sessionStats.go_first_rate,
        };
      } else {
        // 当月統計: 従来通り
        statsData.value = {
          current_deck: latestDuel?.deck?.name || (LL.value?.obs.streamerPopup.items.notSet() ?? 'Not Set'),
          current_rank: latestDuel?.rank || null,
          current_rate: latestDuel?.rate_value || null,
          current_dc: latestDuel?.dc_value || null,
          total_duels: overall.total || 0,
          win_rate: overall.win_rate || 0,
          first_turn_win_rate: overall.first_turn_win_rate || 0,
          second_turn_win_rate: overall.second_turn_win_rate || 0,
          coin_win_rate: overall.coin_win_rate || 0,
          go_first_rate: overall.go_first_rate || 0,
        };
      }
    }

    loading.value = false;
    logger.debug('Data fetched successfully');

    // コンテンツに合わせてウィンドウサイズを調整（CSSレンダリング完了を待つ）
    setTimeout(() => {
      resizeWindowToContent();
    }, 100);
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    errorMessage.value = LL.value?.common.dataFetchError() ?? 'Failed to fetch data';
    loading.value = false;
  }
};

// 認証状態の監視
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    fetchData();
  }
});

onMounted(() => {
  document.body.classList.add('streamer-popup-page');

  // 認証初期化を待つ
  authStore.fetchUser().then(() => {
    fetchData();
  });

  // 定期的にデータを更新
  refreshTimer = setInterval(() => {
    if (isAuthenticated.value) {
      fetchData();
    }
  }, refreshInterval.value);
});

onUnmounted(() => {
  document.body.classList.remove('streamer-popup-page');
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped lang="scss">
.streamer-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: transparent;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;
  z-index: 9999;
  padding: 16px;

  // クロマキー背景
  &.chroma-key-green {
    background: #00FF00 !important;

    // カードの背景を不透明にする
    .stat-item {
      background: #1a1a1a !important;
      border-color: rgba(0, 217, 255, 0.4) !important;
    }
  }

  &.chroma-key-blue {
    background: #0000FF !important;

    // カードの背景を不透明にする
    .stat-item {
      background: #1a1a1a !important;
      border-color: rgba(0, 217, 255, 0.4) !important;
    }
  }

  // ダークテーマ
  &.theme-dark {
    --bg-primary: rgba(18, 18, 18, 0.92);
    --bg-item: rgba(0, 217, 255, 0.05);
    --bg-item-hover: rgba(0, 217, 255, 0.1);
    --border-item: rgba(0, 217, 255, 0.2);
    --text-primary: rgba(228, 231, 236, 0.8);
    --text-secondary: rgba(228, 231, 236, 0.7);
    --gradient-start: #00d9ff;
    --gradient-end: #b536ff;
    --shadow-glow: rgba(0, 217, 255, 0.5);
    --win-color: #4caf50;
    --lose-color: #f44336;
  }

  // ライトテーマ
  &.theme-light {
    --bg-primary: rgba(255, 255, 255, 0.98);
    --bg-item: rgba(240, 248, 255, 0.85);
    --bg-item-hover: rgba(230, 240, 255, 0.95);
    --border-item: rgba(0, 100, 200, 0.35);
    --text-primary: rgba(20, 20, 20, 0.95);
    --text-secondary: rgba(50, 50, 50, 0.85);
    --gradient-start: #0066cc;
    --gradient-end: #8844ff;
    --shadow-glow: rgba(0, 100, 200, 0.5);
    --win-color: #2e7d32;
    --lose-color: #c62828;
  }
}

.stats-container {
  width: 100%;
}

// レスポンシブグリッド
.stats-card {
  display: flex;
  gap: 10px;
  background: transparent;

  // グリッド（自動調整）- ウィンドウサイズに応じて列数を自動調整
  &.layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }

  // 横並び（1行に収める）
  &.layout-horizontal {
    flex-direction: row;
    flex-wrap: nowrap;
  }

  // 縦並び
  &.layout-vertical {
    flex-direction: column;
  }
}

.stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-item);
  border-radius: 8px;
  border: 1px solid var(--border-item);
  transition: all 0.3s ease;
  min-width: max-content;

  // グリッドレイアウト時は幅を自動調整
  .layout-grid & {
    min-width: 0;
    justify-content: center;
  }

  &:hover {
    background: var(--bg-item-hover);
    transform: translateY(-1px);
  }

  &.deck-item {
    grid-column: 1 / -1; // デッキ名は全幅
    justify-content: center;
  }
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid var(--border-item);
  border-radius: 50%;
  flex-shrink: 0;

  .mdi {
    font-size: 20px;
    background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  text-align: center;
  white-space: nowrap;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;

  &.deck-value {
    font-size: 16px;
    white-space: normal;
    word-break: break-word;
  }
}

// ローディング・エラー
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-text,
.error-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-text {
  color: rgba(255, 69, 96, 0.8);
}

.error-detail {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}
</style>
