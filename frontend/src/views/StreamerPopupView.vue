<template>
  <div class="streamer-popup" :class="['layout-' + layout, 'theme-' + theme]">
    <div v-if="!loading && hasData" class="stats-container">
      <!-- 統計カード -->
      <div
        v-if="showStats"
        class="stats-card"
        :class="[{ 'single-column': statsItems.length === 1 }, 'layout-' + layout]"
      >
        <div
          v-for="item in statsItems"
          :key="item.key"
          class="stat-item"
          :class="{ 'deck-item': item.key === 'current_deck' }"
        >
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :class="{ 'deck-value': item.key === 'current_deck' }">
            {{ item.format(statsData[item.key]) }}
          </div>
        </div>
      </div>

      <!-- 対戦履歴 -->
      <div v-if="showHistory && recentDuels.length > 0" class="history-container">
        <div class="history-title">対戦履歴</div>
        <div class="history-list">
          <div
            v-for="duel in recentDuels"
            :key="duel.id"
            class="history-item"
            :class="{ win: duel.is_win, lose: !duel.is_win }"
          >
            <span class="result">{{ duel.is_win ? 'WIN' : 'LOSE' }}</span>
            <span class="deck">{{ duel.deck?.name || '-' }}</span>
            <span class="vs">vs</span>
            <span class="opponent">{{ duel.opponent_deck?.name || '-' }}</span>
            <span class="turn">{{ duel.is_going_first ? '先攻' : '後攻' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-container">
      <div class="loading-text">読み込み中...</div>
    </div>

    <div v-else-if="!isAuthenticated" class="error-container">
      <div class="error-text">ログインが必要です</div>
      <div class="error-detail">ログイン状態でこのページを開いてください</div>
    </div>

    <div v-else class="error-container">
      <div class="error-text">{{ errorMessage || 'データの取得に失敗しました' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/services/api';
import { getRankName } from '@/utils/ranks';
import { createLogger } from '@/utils/logger';
import { useAuthStore } from '@/stores/auth';
import type { GameMode, Duel } from '@/types';

const logger = createLogger('StreamerPopup');

const route = useRoute();
const authStore = useAuthStore();
const loading = ref(true);
const errorMessage = ref<string>('');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// クエリパラメータから設定を取得
const itemsParam = ref((route.query.items as string) || 'win_rate,total_duels');
const layout = ref((route.query.layout as string) || 'vertical');
const theme = ref((route.query.theme as string) || 'dark');
const refreshInterval = ref(Number(route.query.refresh) || 30000);
const historyLimit = ref(Number(route.query.history_limit) || 5);
const gameMode = ref<GameMode>((route.query.game_mode as GameMode) || 'RANK');

// データ
const statsData = ref<Record<string, unknown>>({});
const recentDuels = ref<Duel[]>([]);

// 認証状態
const isAuthenticated = computed(() => authStore.isAuthenticated);

// 表示項目の設定
const selectedItems = computed(() => itemsParam.value.split(',').filter(Boolean));
const showStats = computed(() => selectedItems.value.some((item) => item !== 'history'));
const showHistory = computed(() => selectedItems.value.includes('history'));

// ランクマップ
const rankTierLabelMap: Record<string, string> = {
  BEGINNER: 'ビギナー',
  BRONZE: 'ブロンズ',
  SILVER: 'シルバー',
  GOLD: 'ゴールド',
  PLATINUM: 'プラチナ',
  DIAMOND: 'ダイヤ',
  MASTER: 'マスター',
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
      const tierLabel = rankTierLabelMap[tier];
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
interface DisplayItemDef {
  key: string;
  label: string;
  format: (v: unknown) => string;
}

const allDisplayItems: DisplayItemDef[] = [
  {
    key: 'current_deck',
    label: '使用デッキ',
    format: (v) => (v as string | undefined) || '未設定',
  },
  { key: 'current_rank', label: 'ランク', format: formatRankValue },
  { key: 'current_rate', label: 'レート', format: (v) => formatDecimalValue(v) },
  { key: 'current_dc', label: 'DC', format: (v) => formatDecimalValue(v) },
  { key: 'total_duels', label: '総試合数', format: formatIntegerValue },
  { key: 'win_rate', label: '勝率', format: (v) => formatPercentageValue(v) },
  { key: 'first_turn_win_rate', label: '先攻勝率', format: (v) => formatPercentageValue(v) },
  { key: 'second_turn_win_rate', label: '後攻勝率', format: (v) => formatPercentageValue(v) },
  { key: 'coin_win_rate', label: 'コイン勝率', format: (v) => formatPercentageValue(v) },
  { key: 'go_first_rate', label: '先攻率', format: (v) => formatPercentageValue(v) },
];

const statsItems = computed(() => {
  return selectedItems.value
    .filter((key) => key !== 'history')
    .map((key) => allDisplayItems.find((item) => item.key === key))
    .filter((item): item is DisplayItemDef => item !== undefined);
});

const hasData = computed(
  () => Object.keys(statsData.value).length > 0 || recentDuels.value.length > 0,
);

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

      statsData.value = {
        current_deck: latestDuel?.deck?.name || '未設定',
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

      // 対戦履歴
      if (showHistory.value) {
        recentDuels.value = duels.slice(0, historyLimit.value);
      }
    }

    loading.value = false;
    logger.debug('Data fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    errorMessage.value = 'データの取得に失敗しました';
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
  flex-direction: column;
  background: transparent;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;
  z-index: 9999;

  &.layout-grid {
    align-items: center;
    justify-content: center;
  }

  &.layout-horizontal {
    align-items: center;
    justify-content: center;
  }

  &.layout-vertical {
    align-items: flex-start;
    justify-content: flex-start;
    padding: 20px;
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
  max-width: 800px;
  padding: 20px;

  .layout-vertical & {
    max-width: 450px;
    padding: 0;
  }
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
  background: transparent;
  border-radius: 12px;

  &.single-column {
    grid-template-columns: 1fr;
    max-width: 300px;
  }

  &.layout-horizontal {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  &.layout-vertical {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--bg-item);
  border-radius: 10px;
  border: 1px solid var(--border-item);
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-item-hover);
    transform: translateY(-1px);
  }

  &.deck-item {
    min-height: 80px;
  }
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;

  &.deck-value {
    font-size: 18px;
    white-space: normal;
    word-break: break-word;
  }
}

// 対戦履歴
.history-container {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-item);
  border-radius: 10px;
  border: 1px solid var(--border-item);
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);

  &.win {
    border-left: 3px solid var(--win-color);
  }

  &.lose {
    border-left: 3px solid var(--lose-color);
  }

  .result {
    font-weight: 700;
    min-width: 40px;
  }

  &.win .result {
    color: var(--win-color);
  }

  &.lose .result {
    color: var(--lose-color);
  }

  .deck {
    font-weight: 500;
    flex: 1;
  }

  .vs {
    color: var(--text-secondary);
    font-size: 12px;
  }

  .opponent {
    flex: 1;
    color: var(--text-secondary);
  }

  .turn {
    font-size: 12px;
    color: var(--text-secondary);
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
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-text {
  color: rgba(255, 69, 96, 0.8);
}

.error-detail {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}
</style>
