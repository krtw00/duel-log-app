<!--
/**
 * DashboardView.vue
 *
 * ダッシュボードビューコンポーネント
 *
 * 機能:
 * - ゲームモード別（RANK/RATE/EVENT/DC）の対戦履歴表示
 * - 年月による期間フィルタリング
 * - 統計情報の概要表示（勝率、先攻/後攻勝率など）
 * - OBSオーバーレイ機能へのアクセス
 * - 対戦履歴の一覧表示と管理（追加・編集・削除）
 *
 * データフロー:
 * 1. マウント時: 現在の年月で対戦記録とデッキ一覧を取得
 * 2. 年月変更時: 対戦記録を再取得
 * 3. ゲームモード切り替え時: 表示する対戦記録をフィルタリング
 * 4. 対戦追加/編集/削除後: 対戦記録を再取得して表示を更新
 *
 * 状態管理:
 * - currentMode: 現在選択中のゲームモード
 * - selectedYear/Month: 現在選択中の年月
 * - duels: 取得した全対戦記録（ゲームモード別に分類）
 * - decks: デッキ一覧（対戦記録の表示用）
 */
-->
<template>
  <div>
    <!-- ナビゲーションバー -->
    <app-bar current-view="dashboard" @toggle-drawer="drawer = !drawer" />

    <!-- レスポンシブ対応のナビゲーションドロワー -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav dense>
        <v-list-item
          v-for="item in navItems"
          :key="item.view"
          :prepend-icon="item.icon"
          :to="item.path"
          :title="item.name"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6 pa-sm-6 pa-xs-3">
        <DashboardHeader
          v-model:game-mode="currentMode"
          v-model:year="selectedYear"
          v-model:month="selectedMonth"
          :rank-count="rankDuels.length"
          :rate-count="rateDuels.length"
          :event-count="eventDuels.length"
          :dc-count="dcDuels.length"
          @update:year="fetchDuels"
          @update:month="fetchDuels"
        />

        <StatisticsSection :duels="duels" :decks="decks" :current-mode="currentMode" />

        <OBSSection />

        <DuelHistorySection
          :duels="currentDuels"
          :decks="decks"
          :loading="loading"
          :year="selectedYear"
          :month="selectedMonth"
          :game-mode="currentMode"
          :default-game-mode="currentMode"
          @refresh="fetchDuels"
        />
      </v-container>
    </v-main>

    <!-- 共有リンク生成ダイアログ -->
    <share-stats-dialog
      v-model="shareDialogOpened"
      :initial-year="selectedYear"
      :initial-month="selectedMonth"
      :initial-game-mode="currentMode"
    />


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/api';
import type { Duel, Deck, GameMode } from '@/types';

// Components
import AppBar from '@/components/layout/AppBar.vue';
import DashboardHeader from './DashboardHeader.vue';
import StatisticsSection from './StatisticsSection.vue';
import OBSSection from './OBSSection.vue';
import DuelHistorySection from './DuelHistorySection.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue';

// Navigation
const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

// Shared state
const duels = ref<Duel[]>([]);
const decks = ref<Deck[]>([]);
const loading = ref(false);
const currentMode = ref<GameMode>('RANK');
const shareDialogOpened = ref(false);

// 年月選択
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);


// ゲームモード別にデュエルをフィルタリング
// 各ゲームモードのバッジに表示する対戦数を計算するために使用
const rankDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RANK'));
const rateDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RATE'));
const eventDuels = computed(() => duels.value.filter((d) => d.game_mode === 'EVENT'));
const dcDuels = computed(() => duels.value.filter((d) => d.game_mode === 'DC'));

/**
 * 現在選択中のゲームモードに対応する対戦記録を取得
 *
 * DuelHistorySectionとStatisticsSectionに渡す対戦記録をフィルタリングします。
 * ゲームモードが切り替わると自動的に表示する対戦記録も更新されます。
 */
const currentDuels = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankDuels.value;
    case 'RATE':
      return rateDuels.value;
    case 'EVENT':
      return eventDuels.value;
    case 'DC':
      return dcDuels.value;
    default:
      return [];
  }
});



/**
 * 対戦記録とデッキ一覧を取得
 *
 * 選択中の年月に対応する対戦記録と、全デッキ一覧を並列で取得します。
 * 取得後、各対戦記録にデッキ情報をJOINして表示用のデータを構築します。
 *
 * 呼び出しタイミング:
 * - コンポーネントマウント時
 * - 年月フィルタが変更された時
 * - 対戦記録の追加/編集/削除後（DuelHistorySectionから@refreshイベント経由）
 */
const fetchDuels = async () => {
  loading.value = true;
  try {
    // 対戦記録とデッキ一覧を並列で取得（パフォーマンス向上）
    const [duelsResponse, decksResponse] = await Promise.all([
      api.get('/duels/', {
        params: {
          year: selectedYear.value,
          month: selectedMonth.value,
        },
      }),
      api.get('/decks/'),
    ]);

    decks.value = decksResponse.data;

    // デッキIDをキーとしたMapを作成（O(1)でデッキ情報を検索可能）
    const deckMap = new Map(decks.value.map(deck => [deck.id, deck]));

    // 各対戦記録にデッキ情報をJOIN
    // deck: プレイヤーが使用したデッキ情報
    // opponentdeck: 相手が使用したデッキ情報
    duels.value = duelsResponse.data.map((duel: Duel) => ({
      ...duel,
      deck: deckMap.get(duel.deck_id),
      opponentdeck: deckMap.get(duel.opponentDeck_id),
    }));
  } catch (error) {
    console.error('Failed to fetch duels:', error);
  } finally {
    loading.value = false;
  }
};





// Lifecycle
onMounted(() => {
  fetchDuels();
});

// Expose for testing
defineExpose({
  shareDialogOpened,
});
</script>

<style scoped>
.main-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.duel-table-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
