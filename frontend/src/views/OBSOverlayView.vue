<template>
  <div class="obs-overlay" :class="['layout-' + layout, 'theme-' + theme]">
    <!-- ローディング中 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text">読み込み中...</div>
    </div>

    <!-- エラー（トークンなし、認証エラーなど） -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-text">{{ errorMessage || 'データの取得に失敗しました' }}</div>
      <div v-if="!token" class="error-detail">URLにトークンが含まれていません</div>
    </div>

    <!-- データ表示（空データでも表示） -->
    <div v-else class="stats-container">
      <div
        class="stats-card"
        :class="[{ 'single-column': displayItems.length === 1 }, 'layout-' + layout]"
      >
        <div
          v-for="item in displayItems"
          :key="item.key"
          class="stat-item"
          :class="{ 'deck-item': item.key === 'current_deck' }"
        >
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :class="{ 'deck-value': item.key === 'current_deck' }">
            {{ item.format(displayStats[item.key]) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios, { AxiosError } from 'axios';
import { getRankName } from '@/utils/ranks';
import { createLogger } from '@/utils/logger';
import type { OBSStatsResponse, OBSDisplayItemDefinition, OBSQueryParams } from '@/types/obs';
import type { ApiErrorResponse } from '@/types/api';
import type { GameMode } from '@/types';

const logger = createLogger('OBS');

const route = useRoute();
const loading = ref(true);
const stats = ref<OBSStatsResponse | null>(null);
const errorMessage = ref<string>('');

// クエリパラメータから設定を取得
const token = ref(route.query.token as string);
const allowedPeriodTypes = ['monthly', 'recent', 'from_start'] as const;
const initialPeriodType = (route.query.period_type as string) || 'monthly';
const periodType = ref(
  allowedPeriodTypes.includes(initialPeriodType as (typeof allowedPeriodTypes)[number])
    ? initialPeriodType
    : 'monthly',
);
const year = ref(Number(route.query.year) || new Date().getFullYear());
const month = ref(Number(route.query.month) || new Date().getMonth() + 1);
const limit = ref(Number(route.query.limit) || 30);
const gameMode = ref<string | undefined>((route.query.game_mode as string) || undefined);
const startId = ref<number | undefined>(
  route.query.start_id ? Number(route.query.start_id) : undefined,
);
const displayItemsParam = ref((route.query.display_items as string) || '');
const layout = ref((route.query.layout as string) || 'grid');
const theme = ref((route.query.theme as string) || 'dark');
const refreshInterval = ref(Number(route.query.refresh) || 30000); // デフォルト30秒

const rankTierLabelMap: Record<string, string> = {
  BEGINNER: 'ビギナー',
  BRONZE: 'ブロンズ',
  SILVER: 'シルバー',
  GOLD: 'ゴールド',
  PLATINUM: 'プラチナ',
  DIAMOND: 'ダイヤ',
  MASTER: 'マスター',
};

const normalizeNumericValue = (value: string | number | null | undefined): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  const trimmed = value.trim();
  const directNumber = Number(trimmed);
  if (!Number.isNaN(directNumber)) {
    return directNumber;
  }
  const numericMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
  if (numericMatch) {
    const extracted = Number(numericMatch[0]);
    return Number.isNaN(extracted) ? null : extracted;
  }
  return null;
};

const formatDecimalValue = (
  value: string | number | null | undefined,
  fractionDigits = 2,
): string => {
  const numeric = normalizeNumericValue(value);
  if (numeric === null) {
    return '-';
  }
  return numeric.toFixed(fractionDigits);
};

const formatPercentageValue = (
  value: string | number | null | undefined,
  fractionDigits = 1,
): string => {
  const numeric = normalizeNumericValue(value);
  if (numeric === null) {
    return '-';
  }
  const percentage = numeric <= 1 ? numeric * 100 : numeric;
  return `${percentage.toFixed(fractionDigits)}%`;
};

const formatIntegerValue = (value: string | number | null | undefined): string => {
  const numeric = normalizeNumericValue(value);
  if (numeric === null) {
    return '0';
  }
  return Math.round(numeric).toString();
};

const formatRankValue = (value: string | number | null | undefined): string => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const upper = trimmed.toUpperCase();
    const match = /^([A-Z]+)[ _-]?([0-9]+)$/.exec(upper);
    if (match) {
      const [, tier, stage] = match;
      const tierLabel = rankTierLabelMap[tier];
      if (tierLabel) {
        return `${tierLabel}${stage}`;
      }
    }
    const numericFromString = normalizeNumericValue(trimmed);
    if (numericFromString !== null) {
      return getRankName(numericFromString);
    }
    return trimmed;
  }
  const numeric = normalizeNumericValue(value);
  if (numeric !== null) {
    return getRankName(numeric);
  }
  return '-';
};

// 表示項目のリスト
const allDisplayItems: OBSDisplayItemDefinition[] = [
  {
    key: 'current_deck',
    label: '使用デッキ',
    format: (v) => (v as string | undefined) || '未設定',
  },
  { key: 'current_rank', label: 'ランク', format: (v) => formatRankValue(v) },
  {
    key: 'current_rate',
    label: 'レート',
    format: (v) => formatDecimalValue(v),
  },
  {
    key: 'current_dc',
    label: 'DC',
    format: (v) => formatDecimalValue(v),
  },
  {
    key: 'total_duels',
    label: '総試合数',
    format: (v) => formatIntegerValue(v),
  },
  {
    key: 'win_rate',
    label: '勝率',
    format: (v) => formatPercentageValue(v),
  },
  {
    key: 'first_turn_win_rate',
    label: '先攻勝率',
    format: (v) => formatPercentageValue(v),
  },
  {
    key: 'second_turn_win_rate',
    label: '後攻勝率',
    format: (v) => formatPercentageValue(v),
  },
  {
    key: 'coin_win_rate',
    label: 'コイン勝率',
    format: (v) => formatPercentageValue(v),
  },
  {
    key: 'go_first_rate',
    label: '先攻率',
    format: (v) => formatPercentageValue(v),
  },
];

// 表示する項目をフィルタリング（URLパラメータの順番を保持）
const displayItems = computed(() => {
  if (!displayItemsParam.value) {
    // パラメータがない場合は全項目（総試合数を除く）
    return allDisplayItems.filter((item) => item.key !== 'total_duels');
  }
  const selectedKeys = displayItemsParam.value.split(',');
  // URLパラメータの順番通りに並べる
  return selectedKeys
    .map((key) => allDisplayItems.find((item) => item.key === key))
    .filter((item): item is OBSDisplayItemDefinition => item !== undefined);
});

// 空データ時のデフォルト値
const emptyStats: OBSStatsResponse = {
  total_duels: 0,
  win_rate: 0,
  first_turn_win_rate: 0,
  second_turn_win_rate: 0,
  coin_win_rate: 0,
  go_first_rate: 0,
  current_deck: undefined,
  current_rank: undefined,
  current_rate: undefined,
  current_dc: undefined,
};

// エラー状態の判定（トークンなし、認証エラーなど）
const hasError = computed(() => {
  return !token.value || (errorMessage.value !== '' && stats.value === null);
});

// 表示用の統計データ（空データでもデフォルト値を使用）
const displayStats = computed(() => {
  return stats.value || emptyStats;
});

const fetchStats = async () => {
  try {
    // トークンがない場合はエラー
    if (!token.value) {
      logger.error('No token provided in URL parameters');
      loading.value = false;
      return;
    }

    logger.debug('Fetching stats');

    const params: Partial<OBSQueryParams> = {
      token: token.value,
      period_type: periodType.value as 'monthly' | 'recent' | 'from_start',
    };

    // 集計期間に応じたパラメータ
    if (periodType.value === 'monthly') {
      params.year = year.value;
      params.month = month.value;
    } else if (periodType.value === 'recent') {
      params.limit = limit.value;
    } else if (periodType.value === 'from_start') {
      if (startId.value !== undefined) {
        params.start_id = startId.value;
      }
    }

    // ゲームモード
    if (gameMode.value) {
      params.game_mode = gameMode.value as GameMode;
    }

    // 環境変数からAPIのベースURLを取得
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // 直接axiosを使用してAPIリクエスト（インターセプターを回避）
    const response = await axios.get(`${API_BASE_URL}/statistics/obs`, {
      params,
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    logger.debug('Stats fetched successfully');
    stats.value = response.data as OBSStatsResponse;
    loading.value = false;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    logger.error(
      'Failed to fetch OBS statistics:',
      axiosError.response?.status || axiosError.message,
    );

    // エラーメッセージを設定
    if (axiosError.response?.status === 401) {
      errorMessage.value = '認証エラー: トークンが無効です';
    } else if (axiosError.response?.status === 404) {
      errorMessage.value = 'エンドポイントが見つかりません';
    } else if (axiosError.response) {
      const detail = axiosError.response.data?.detail;
      const detailMessage = typeof detail === 'string' ? detail : axiosError.message;
      errorMessage.value = `サーバーエラー: ${axiosError.response.status} - ${detailMessage}`;
    } else if (axiosError.request) {
      errorMessage.value = 'ネットワークエラー: サーバーに接続できません';
    } else {
      errorMessage.value = `エラー: ${axiosError.message}`;
    }

    loading.value = false;
  }
};

onMounted(() => {
  // OBSオーバーレイ用のクラスをbody要素に追加
  document.body.classList.add('obs-overlay-page');

  fetchStats();

  // 定期的に統計情報を更新
  setInterval(() => {
    fetchStats();
  }, refreshInterval.value);
});

onUnmounted(() => {
  // コンポーネント破棄時にクラスを削除
  document.body.classList.remove('obs-overlay-page');
});
</script>

<style scoped lang="scss">
.obs-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  background: transparent;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;
  z-index: 9999;

  // グリッドレイアウト（デフォルト）
  &.layout-grid {
    align-items: center;
    justify-content: center;
  }

  // 横1列レイアウト（上下左右中央揃え）
  &.layout-horizontal {
    align-items: center;
    justify-content: center;
  }

  // 縦1列レイアウト（上下左右中央揃え）
  &.layout-vertical {
    align-items: center;
    justify-content: center;
  }

  // テーマカラー設定
  // ダークモード（デフォルト）
  &.theme-dark {
    --bg-primary: rgba(18, 18, 18, 0.92);
    --bg-item: rgba(0, 217, 255, 0.05);
    --bg-item-hover: rgba(0, 217, 255, 0.1);
    --border-primary: rgba(0, 217, 255, 0.3);
    --border-secondary: rgba(0, 217, 255, 0.2);
    --border-item: rgba(0, 217, 255, 0.2);
    --border-item-hover: rgba(0, 217, 255, 0.4);
    --text-primary: rgba(228, 231, 236, 0.8);
    --text-secondary: rgba(228, 231, 236, 0.7);
    --gradient-start: #00d9ff;
    --gradient-end: #b536ff;
    --shadow-color: rgba(0, 217, 255, 0.2);
    --shadow-glow: rgba(0, 217, 255, 0.5);
  }

  // ライトモード
  &.theme-light {
    --bg-primary: rgba(255, 255, 255, 0.98);
    --bg-item: rgba(240, 248, 255, 0.85);
    --bg-item-hover: rgba(230, 240, 255, 0.95);
    --border-primary: rgba(0, 100, 200, 0.5);
    --border-secondary: rgba(0, 100, 200, 0.4);
    --border-item: rgba(0, 100, 200, 0.35);
    --border-item-hover: rgba(0, 100, 200, 0.6);
    --text-primary: rgba(20, 20, 20, 0.95);
    --text-secondary: rgba(50, 50, 50, 0.85);
    --gradient-start: #0066cc;
    --gradient-end: #8844ff;
    --shadow-color: rgba(0, 100, 200, 0.2);
    --shadow-glow: rgba(0, 100, 200, 0.5);
  }
}

.stats-container {
  width: 100%;
  max-width: 800px;
  padding: 20px;

  .layout-horizontal & {
    max-width: none;
    width: auto;
    padding: 20px;
  }

  .layout-vertical & {
    max-width: none;
    width: auto;
    padding: 20px;
  }
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px;
  background: transparent;
  border-radius: 16px;
  border: none;
  box-shadow: none;
  backdrop-filter: none;

  &.single-column {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  // 横1列レイアウト（下部に配置、中央揃え）
  &.layout-horizontal {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: auto;
    max-width: none;
    padding: 12px 24px;
    gap: 12px;
  }

  // 縦1列レイアウト（右端に配置、下に伸ばす）
  &.layout-vertical {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    width: 100%;
    max-width: 450px;
    padding: 12px;
    gap: 12px;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--bg-item);
  border-radius: 12px;
  border: 1px solid var(--border-item);
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-item-hover);
    border-color: var(--border-item-hover);
    transform: translateY(-2px);
  }

  // デッキ名の場合は高さを自動調整
  &.deck-item {
    min-height: 100px;
    height: auto;
  }

  // 横レイアウトの場合
  .layout-horizontal & {
    min-width: 180px;
    flex-shrink: 0;
  }
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  // デッキ名の場合は改行を許可し、フォントサイズを調整
  &.deck-value {
    font-size: 20px;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.3;
    padding: 0 4px;
  }
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-text,
.error-text {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--shadow-glow);
}

.error-text {
  color: rgba(255, 69, 96, 0.8);
  text-shadow: 0 0 10px rgba(255, 69, 96, 0.5);
}

.error-detail {
  font-size: 16px;
  color: var(--text-secondary);
  margin-top: 12px;
}

// レスポンシブ対応
@media (max-width: 768px) {
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .stats-card {
    grid-template-columns: 1fr;
  }
}
</style>
