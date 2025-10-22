<template>
  <div class="obs-overlay" :class="['layout-' + layout, 'theme-' + theme]">
    <div v-if="!loading && stats" class="stats-container">
      <div class="stats-header">
        <h2 class="stats-title">{{ periodTitle }}</h2>
      </div>
      <div class="stats-card" :class="[
        { 'single-column': displayItems.length === 1 },
        'layout-' + layout
      ]">
        <div v-for="item in displayItems" :key="item.key" class="stat-item" :class="{ 'deck-item': item.key === 'current_deck' }">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :class="{ 'deck-value': item.key === 'current_deck' }">{{ stats && item.format(stats[item.key]) }}</div>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="loading-container">
      <div class="loading-text">読み込み中...</div>
    </div>
    <div v-else class="error-container">
      <div class="error-text">{{ errorMessage || 'データの取得に失敗しました' }}</div>
      <div v-if="!token" class="error-detail">URLにトークンが含まれていません</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios, { AxiosError } from 'axios';
import { getRankName } from '@/utils/ranks';
import type { OBSStatsResponse, OBSDisplayItemDefinition, OBSQueryParams } from '@/types/obs';
import type { ApiErrorResponse } from '@/types/api';
import type { GameMode } from '@/types';

const route = useRoute();
const loading = ref(true);
const stats = ref<OBSStatsResponse | null>(null);
const errorMessage = ref<string>('');

// クエリパラメータから設定を取得
const token = ref(route.query.token as string);
const allowedPeriodTypes = ['monthly', 'recent'] as const;
const initialPeriodType = (route.query.period_type as string) || 'recent';
const periodType = ref(
  allowedPeriodTypes.includes(initialPeriodType as (typeof allowedPeriodTypes)[number])
    ? initialPeriodType
    : 'recent',
);
const year = ref(Number(route.query.year) || new Date().getFullYear());
const month = ref(Number(route.query.month) || new Date().getMonth() + 1);
const limit = ref(Number(route.query.limit) || 30);
const gameMode = ref<string | undefined>((route.query.game_mode as string) || undefined);
const displayItemsParam = ref((route.query.display_items as string) || '');
const layout = ref((route.query.layout as string) || 'grid');
const theme = ref((route.query.theme as string) || 'dark');
const refreshInterval = ref(Number(route.query.refresh) || 30000); // デフォルト30秒

// 表示項目のリスト
// Note: バックエンドのOBS APIは既にパーセント値（0-100）を返すため、100倍しない
const allDisplayItems: OBSDisplayItemDefinition[] = [
  { key: 'current_deck', label: '使用デッキ', format: (v) => (v as string | undefined) || '未設定' },
  { key: 'current_rank', label: 'ランク', format: (v) => v ? getRankName(Number(v)) : '-' },
  { key: 'total_duels', label: '総試合数', format: (v) => (v as number | undefined)?.toString() || '0' },
  { key: 'win_rate', label: '勝率', format: (v) => v !== undefined ? `${(v as number).toFixed(1)}%` : '-' },
  { key: 'first_turn_win_rate', label: '先行勝率', format: (v) => v !== undefined ? `${(v as number).toFixed(1)}%` : '-' },
  { key: 'second_turn_win_rate', label: '後攻勝率', format: (v) => v !== undefined ? `${(v as number).toFixed(1)}%` : '-' },
  { key: 'coin_win_rate', label: 'コイン勝率', format: (v) => v !== undefined ? `${(v as number).toFixed(1)}%` : '-' },
  { key: 'go_first_rate', label: '先行率', format: (v) => v !== undefined ? `${(v as number).toFixed(1)}%` : '-' },
];

// 表示する項目をフィルタリング（URLパラメータの順番を保持）
const displayItems = computed(() => {
  if (!displayItemsParam.value) {
    // パラメータがない場合は全項目（総試合数を除く）
    return allDisplayItems.filter(item => item.key !== 'total_duels');
  }
  const selectedKeys = displayItemsParam.value.split(',');
  // URLパラメータの順番通りに並べる
  return selectedKeys
    .map(key => allDisplayItems.find(item => item.key === key))
    .filter((item): item is OBSDisplayItemDefinition => item !== undefined);
});

// タイトル文字列
const periodTitle = computed(() => {
  if (periodType.value === 'monthly') {
    return `${year.value}年${month.value}月の成績`;
  } else {
    return `直近${limit.value}戦の成績`;
  }
});

const fetchStats = async () => {
  try {
    // トークンがない場合はエラー
    if (!token.value) {
      console.error('[OBS] No token provided in URL parameters');
      loading.value = false;
      return;
    }

    console.log('[OBS] Fetching stats with token:', token.value.substring(0, 20) + '...');
    console.log('[OBS] Period Type:', periodType.value, 'Game Mode:', gameMode.value);

    const params: Partial<OBSQueryParams> = {
      token: token.value,
      period_type: periodType.value as 'monthly' | 'recent',
    };

    // 集計期間に応じたパラメータ
    if (periodType.value === 'monthly') {
      params.year = year.value;
      params.month = month.value;
    } else if (periodType.value === 'recent') {
      params.limit = limit.value;
    }

    // ゲームモード
    if (gameMode.value) {
      params.game_mode = gameMode.value as GameMode;
    }

    // 環境変数からAPIのベースURLを取得
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    console.log('[OBS] API Base URL:', API_BASE_URL);

    // 直接axiosを使用してAPIリクエスト（インターセプターを回避）
    const response = await axios.get(`${API_BASE_URL}/statistics/obs`, {
      params,
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    console.log('[OBS] Stats fetched successfully:', response.data);
    stats.value = response.data as OBSStatsResponse;
    loading.value = false;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    console.error('[OBS] Failed to fetch OBS statistics:', axiosError);
    console.error('[OBS] Error response:', axiosError.response?.data);
    console.error('[OBS] Error status:', axiosError.response?.status);
    console.error('[OBS] Error message:', axiosError.message);

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
  fetchStats();

  // 定期的に統計情報を更新
  setInterval(() => {
    fetchStats();
  }, refreshInterval.value);
});
</script>

<style lang="scss">
// OBSオーバーレイではVuetifyの背景を透明にする
.v-application,
.v-main {
  background: transparent !important;
}
</style>

<style scoped lang="scss">
.obs-overlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  background: transparent;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;

  // グリッドレイアウト（デフォルト）
  &.layout-grid {
    align-items: center;
    justify-content: center;
  }

  // 横1列レイアウト（下部に配置、横に伸ばす）
  &.layout-horizontal {
    align-items: flex-end;
    justify-content: stretch;
  }

  // 縦1列レイアウト（右端に配置、中央に表示）
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
    width: 100%;
    padding: 0 20px 20px 20px;
  }

  .layout-vertical & {
    max-width: none;
    width: auto;
    padding: 0;
  }
}

.stats-header {
  text-align: center;
  margin-bottom: 16px;

  .layout-vertical & {
    margin-bottom: 12px;
  }
}

.stats-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;

  .layout-vertical & {
    font-size: 20px;
    letter-spacing: 1px;
  }
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px;
  background: var(--bg-primary);
  border-radius: 16px;
  border: 2px solid var(--border-primary);
  box-shadow: 0 8px 32px var(--shadow-color);
  backdrop-filter: blur(10px);

  &.single-column {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  // 横1列レイアウト（下部に配置、横に伸ばす）
  &.layout-horizontal {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    grid-template-rows: auto;
    width: 100%;
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
