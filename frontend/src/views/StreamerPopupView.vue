<template>
  <div class="streamer-popup" :class="['theme-' + theme, chromaKeyClass]">
    <!-- ローディング中 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text" :style="{ color: themeStyles.textPrimary }">{{ LL?.common.loading() }}</div>
    </div>

    <!-- 未認証 -->
    <div v-else-if="!isAuthenticated" class="error-container">
      <div class="error-text">{{ LL?.obs.streamerPopup.loginRequired() }}</div>
      <div class="error-detail" :style="{ color: themeStyles.textSecondary }">{{ LL?.obs.streamerPopup.loginRequiredDetail() }}</div>
    </div>

    <!-- エラー -->
    <div v-else-if="errorMessage" class="error-container">
      <div class="error-text">{{ errorMessage }}</div>
    </div>

    <!-- データ表示（空データでも表示） -->
    <div v-else class="stats-container">
      <!-- 統計カード -->
      <div v-if="showStats" ref="statsCardRef" class="stats-card" :class="`layout-${layout}`">
        <div
          v-for="item in statsItems"
          :key="item.key"
          class="stat-item"
          :class="{ 'deck-item': item.key === 'current_deck' }"
          :style="statItemStyle"
        >
          <div class="stat-icon-wrapper" :style="iconWrapperStyle">
            <span class="mdi" :class="item.icon" :style="iconStyle"></span>
          </div>
          <div class="stat-content">
            <div class="stat-label" :style="{ color: themeStyles.textSecondary }">{{ item.label }}</div>
            <div class="stat-value" :class="{ 'deck-value': item.key === 'current_deck' }" :style="valueStyle">
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

// クエリパラメータから設定を取得
const itemsParam = ref((route.query.items as string) || 'win_rate,total_duels');
const theme = ref((route.query.theme as string) || 'dark');
const layout = ref((route.query.layout as string) || 'horizontal');
const refreshInterval = ref(Number(route.query.refresh) || 30000);

// デバッグ: テーマパラメータをログ出力
logger.info(`Popup theme: ${theme.value} (from query: ${route.query.theme})`);

// テーマに基づくスタイル定義
const themeStyles = computed(() => {
  if (theme.value === 'light') {
    return {
      bgItem: 'rgba(255, 255, 255, 0.98)',
      bgItemHover: 'rgba(240, 245, 255, 0.98)',
      borderItem: 'rgba(100, 150, 200, 0.4)',
      textPrimary: 'rgba(30, 30, 40, 0.95)',
      textSecondary: 'rgba(80, 80, 100, 0.9)',
      gradientStart: '#0077cc',
      gradientEnd: '#7744dd',
      iconBg: 'rgba(100, 150, 200, 0.12)',
      boxShadow: '0 2px 12px rgba(0, 50, 100, 0.15)',
    };
  }
  // ダークテーマ（デフォルト）
  return {
    bgItem: 'rgba(30, 30, 35, 0.95)',
    bgItemHover: 'rgba(40, 40, 50, 0.95)',
    borderItem: 'rgba(0, 217, 255, 0.3)',
    textPrimary: 'rgba(228, 231, 236, 0.95)',
    textSecondary: 'rgba(228, 231, 236, 0.75)',
    gradientStart: '#00d9ff',
    gradientEnd: '#b536ff',
    iconBg: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };
});

// 各要素のスタイル
const statItemStyle = computed(() => ({
  background: themeStyles.value.bgItem,
  borderColor: themeStyles.value.borderItem,
  boxShadow: themeStyles.value.boxShadow,
}));

const iconWrapperStyle = computed(() => ({
  background: themeStyles.value.iconBg,
  borderColor: themeStyles.value.borderItem,
}));

const iconStyle = computed(() => ({
  background: `linear-gradient(135deg, ${themeStyles.value.gradientStart} 0%, ${themeStyles.value.gradientEnd} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}));

const valueStyle = computed(() => ({
  background: `linear-gradient(135deg, ${themeStyles.value.gradientStart} 0%, ${themeStyles.value.gradientEnd} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}));

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

// 統計カードへの参照（サイズ測定用）
const statsCardRef = ref<HTMLElement | null>(null);

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

const CONTAINER_PADDING = 16; // .streamer-popupのpadding

/**
 * ウィンドウサイズを調整
 * - horizontal/vertical: コンテンツサイズを測定して固定サイズを決定
 * - grid: 自動リサイズなし（ユーザーが手動で調整、ボックスが自動折り返し）
 */
const resizeWindowToContent = async () => {
  // ポップアップウィンドウでない場合はスキップ
  if (!window.opener) return;

  // グリッドレイアウトは自動リサイズしない（ユーザーが手動で調整）
  if (layout.value === 'grid') {
    logger.info('Grid layout - skip auto resize (user can manually adjust)');
    return;
  }

  await nextTick();

  // レンダリング完了を待つ（requestAnimationFrame × 2回でレイアウト確定を待つ）
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

  // 実際のコンテンツサイズを測定
  if (!statsCardRef.value) return;

  const contentRect = statsCardRef.value.getBoundingClientRect();

  // コンテンツサイズ + 上下左右のpadding
  const targetInnerWidth = Math.ceil(contentRect.width) + (CONTAINER_PADDING * 2);
  const targetInnerHeight = Math.ceil(contentRect.height) + (CONTAINER_PADDING * 2);

  // 現在のウィンドウのchrome（枠）サイズを取得
  const currentChromeWidth = window.outerWidth - window.innerWidth;
  const currentChromeHeight = window.outerHeight - window.innerHeight;

  // resizeToはouterサイズを指定するので、chromeを加算
  const targetWidth = targetInnerWidth + currentChromeWidth;
  const targetHeight = targetInnerHeight + currentChromeHeight;

  logger.info(`${layout.value} layout - Content: ${contentRect.width}x${contentRect.height}, Target: ${targetWidth}x${targetHeight}`);

  try {
    window.resizeTo(targetWidth, targetHeight);
    logger.debug(`Window resized to: ${targetWidth}x${targetHeight}`);
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
        // URLパラメータからinitial_statsを取得
        const initialStatsParam = route.query.initial_stats as string | undefined;
        if (initialStatsParam && statsPeriod.value === 'session') {
          try {
            initialStats.value = JSON.parse(initialStatsParam);
            logger.debug('Initial stats loaded from URL parameter:', initialStats.value);
          } catch (error) {
            logger.error('Failed to parse initial_stats parameter:', error);
            // パースエラーの場合は現在の統計を使用
            initialStats.value = { ...currentStats };
            logger.debug('Fallback: Initial stats saved from current data');
          }
        } else {
          // パラメータがない場合は現在の統計を使用（従来の動作）
          initialStats.value = { ...currentStats };
          logger.debug('Initial stats saved from current data for session tracking');
        }
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
  }

  &.chroma-key-blue {
    background: #0000FF !important;
  }
}

.stats-container {
  // デフォルトは自然なサイズ
}

// レイアウト
.stats-card {
  display: inline-flex;
  gap: 10px;
  background: transparent;

  &.layout-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
    width: 100%;
  }

  &.layout-horizontal {
    flex-direction: row;
    flex-wrap: nowrap;
  }

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
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.3s ease;
  min-width: max-content;

  .layout-grid & {
    min-width: 0;
    flex: 0 0 auto;
  }

  &.deck-item {
    justify-content: center;
    width: 100%;
  }
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 50%;
  flex-shrink: 0;
}

.mdi {
  font-size: 20px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  text-align: center;
  white-space: nowrap;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
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
}

.error-text {
  color: rgba(255, 69, 96, 0.8);
}

.error-detail {
  font-size: 13px;
  margin-top: 6px;
}
</style>
