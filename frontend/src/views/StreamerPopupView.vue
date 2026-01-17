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
import { DUEL_UPDATE_CHANNEL } from '@/services/duelService';
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
const isInitialLoad = ref(true); // 初回ロードフラグ
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// クエリパラメータから設定を取得
const itemsParam = ref((route.query.items as string) || 'win_rate,total_duels');
const theme = ref((route.query.theme as string) || 'dark');
const layout = ref((route.query.layout as string) || 'horizontal');
const refreshInterval = ref(Number(route.query.refresh) || 5000);

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

// セッション統計用: URLパラメータからタイムスタンプを取得
const fromTimestamp = ref<string | null>(
  (route.query.from_timestamp as string) || null
);

// 統計カードへの参照（初回サイズ測定用）
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
 * 初回のみウィンドウサイズをコンテンツに合わせて調整
 */
const resizeWindowOnce = async () => {
  // ポップアップウィンドウでない場合はスキップ
  if (!window.opener) return;

  await nextTick();

  // レンダリング完了を待つ
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

  if (!statsCardRef.value) return;

  const contentRect = statsCardRef.value.getBoundingClientRect();

  // コンテンツサイズ + padding
  const targetInnerWidth = Math.ceil(contentRect.width) + (CONTAINER_PADDING * 2);
  const targetInnerHeight = Math.ceil(contentRect.height) + (CONTAINER_PADDING * 2);

  // ウィンドウのchrome（枠）サイズを取得
  const chromeWidth = window.outerWidth - window.innerWidth;
  const chromeHeight = window.outerHeight - window.innerHeight;

  const targetWidth = targetInnerWidth + chromeWidth;
  const targetHeight = targetInnerHeight + chromeHeight;

  logger.info(`Initial resize - Content: ${contentRect.width}x${contentRect.height}, Target: ${targetWidth}x${targetHeight}`);

  try {
    window.resizeTo(targetWidth, targetHeight);
  } catch (e) {
    logger.debug('Could not resize window:', e);
  }
};

// データ取得（初回のみローディング表示、以降はバックグラウンド更新）
const fetchData = async () => {
  logger.info(`fetchData called, isAuthenticated: ${isAuthenticated.value}`);
  if (!isAuthenticated.value) {
    loading.value = false;
    logger.info('fetchData: not authenticated, returning');
    return;
  }

  try {
    logger.info('Fetching streamer popup data...');

    // APIパラメータを構築
    const params: Record<string, string | number> = {
      game_mode: gameMode.value,
    };

    // セッション統計モードの場合、from_timestampのみを使用（year/monthは送らない）
    if (statsPeriod.value === 'session' && fromTimestamp.value) {
      params.from_timestamp = fromTimestamp.value;
      logger.debug('Using from_timestamp for session stats:', fromTimestamp.value);
    } else {
      // 通常モード: 当月のデータを取得
      const now = new Date();
      params.year = now.getFullYear();
      params.month = now.getMonth() + 1;
    }

    // 統計データを取得
    logger.info(`API call with params: ${JSON.stringify(params)}`);
    const statsResponse = await api.get('/statistics', { params });
    logger.info(`API response received, total duels: ${statsResponse.data[gameMode.value]?.overall_stats?.total}`);

    const modeStats = statsResponse.data[gameMode.value];
    if (modeStats) {
      const overall = modeStats.overall_stats || {};
      const duels = modeStats.duels || [];

      // 最新の対戦からデッキとランク/レート/DCを取得
      const latestDuel = duels.length > 0 ? duels[0] : null;

      // 統計データを設定（タイムスタンプフィルタリングはAPIで行われる）
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

    // 初回ロード完了
    if (isInitialLoad.value) {
      loading.value = false;
      isInitialLoad.value = false;
      // 初回のみウィンドウをコンテンツサイズに合わせる
      setTimeout(() => {
        resizeWindowOnce();
      }, 100);
    }
    logger.info('Data fetched and updated successfully');
  } catch (error) {
    logger.error('Failed to fetch data:', error as Error);
    // 初回のみエラー表示、以降は静かに失敗
    if (isInitialLoad.value) {
      errorMessage.value = LL.value?.common.dataFetchError() ?? 'Failed to fetch data';
      loading.value = false;
      isInitialLoad.value = false;
    }
  }
};

// 認証状態の監視（認証完了時にデータ取得）
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    fetchData();
  }
});

onMounted(async () => {
  document.body.classList.add('streamer-popup-page');

  // BroadcastChannelを最初にセットアップ（認証チェック中のメッセージも受信するため）
  try {
    broadcastChannel = new BroadcastChannel(DUEL_UPDATE_CHANNEL);
    broadcastChannel.onmessage = () => {
      logger.info('Received duel update notification, fetching data');
      fetchData();
    };
    logger.info('BroadcastChannel listener registered');
  } catch {
    logger.debug('BroadcastChannel not supported');
  }

  // 定期更新を設定（フォールバック）
  refreshTimer = setInterval(() => {
    if (isAuthenticated.value) {
      fetchData();
    }
  }, refreshInterval.value);
  logger.info(`Periodic refresh enabled: ${refreshInterval.value}ms`);

  // すでに認証済みなら即座にデータ取得
  if (isAuthenticated.value) {
    fetchData();
  } else {
    // 認証状態を確認してからデータ取得
    await authStore.fetchUser();
    if (isAuthenticated.value) {
      fetchData();
    }
  }
});

onUnmounted(() => {
  document.body.classList.remove('streamer-popup-page');
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  if (broadcastChannel) {
    broadcastChannel.close();
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
  // グリッドレイアウト時はフル幅
  &:has(.layout-grid) {
    width: 100%;
  }
}

// レイアウト
.stats-card {
  background: transparent;

  &.layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
    width: 100%;
  }

  &.layout-horizontal {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
  }

  &.layout-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.3s ease;
  // 固定サイズ（ランク名がフル表示される幅）
  width: 200px;
  height: 60px;
  flex-shrink: 0;
  overflow: hidden;

  // グリッド: 全カード統一サイズ
  .layout-grid & {
    width: 100%;
    height: 60px;
  }
}

.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 50%;
  flex-shrink: 0;
}

.mdi {
  font-size: 18px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  flex: 1;
  min-width: 0; // テキスト省略のために必要
}

.stat-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  &.deck-value {
    font-size: 13px;
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
