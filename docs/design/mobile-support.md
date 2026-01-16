# モバイル対応設計書

## 概要

Duel Log Appのモバイル対応設計書。スマートフォンでの閲覧・入力の両方をサポートする。

## 現状分析

### 対応済み

| カテゴリ | コンポーネント | 対応内容 |
|---------|--------------|---------|
| レイアウト | AppBar | モバイル用ハンバーガーメニュー、レスポンシブフォント |
| レイアウト | NavigationDrawer | `temporary`モードでモバイル対応 |
| グリッド | StatsDisplayCards | `cols="6" sm="4" md="2"` |
| グリッド | StatisticsFilter | `cols="12" sm="6" md="4"` |
| ダイアログ | DuelFormDialog | `fullscreen` on xs |
| テーブル | DuelTable | `mobile-breakpoint="sm"`、一部カラム非表示 |

### 要改善（優先度順）

| 優先度 | 問題 | 影響 | 対象ファイル |
|-------|------|------|------------|
| 🔴 Critical | DuelTableのフォントサイズ(20px)が大きすぎる | スマホで見づらい | DuelTable.vue |
| 🔴 Critical | 統計テーブル（相性表等）のモバイル対応なし | 横スクロール発生 | StatisticsContent.vue |
| 🟠 High | チャート高さ固定(350px) | 画面占有が大きすぎる | StatisticsContent.vue |
| 🟠 High | ラジオボタングループが横並び固定 | モバイルで操作しづらい | DuelFormDialog.vue |
| 🟠 High | コンテナのpadding `pa-6`が大きい | 表示領域が狭い | DashboardView, StatisticsView |
| 🟡 Medium | ダイアログmax-width 500pxが小型端末で大きい | レイアウト崩れ | DecksView.vue |
| 🟡 Medium | タッチターゲット < 44px | 操作しづらい | 複数コンポーネント |
| 🟢 Low | ボトムナビゲーションなし | ナビゲーション利便性 | AppLayout |

---

## 設計方針

### ブレークポイント定義

Vuetifyのデフォルトブレークポイントを使用：

| 名前 | 幅 | 想定デバイス |
|-----|---|------------|
| xs | < 600px | スマートフォン（縦） |
| sm | 600px - 959px | スマートフォン（横）、小型タブレット |
| md | 960px - 1279px | タブレット |
| lg | 1280px - 1919px | デスクトップ |
| xl | >= 1920px | 大画面 |

### デザイン原則

1. **モバイルファースト**: xs → lg の順でスタイル適用
2. **タッチ対応**: 最小タッチターゲット 44x44px
3. **縦スクロール優先**: 横スクロールは極力避ける
4. **コンテンツ優先**: 装飾より情報を優先表示

---

## Phase 1: データテーブル最適化（Critical）

### 1.1 DuelTable改善

**現状の問題:**
- フォントサイズ20pxが大きすぎる
- カラム幅が固定でオーバーフロー

**改善案:**

```vue
<!-- モバイル用カード表示の導入 -->
<template>
  <!-- デスクトップ: テーブル表示 -->
  <v-data-table
    v-if="!isMobile"
    :headers="headers"
    :items="duels"
    ...
  />

  <!-- モバイル: カード表示 -->
  <div v-else class="duel-cards">
    <v-card
      v-for="duel in duels"
      :key="duel.id"
      class="mb-2"
      variant="outlined"
    >
      <v-card-text class="pa-3">
        <div class="d-flex justify-space-between align-center">
          <div>
            <v-chip :color="duel.is_win ? 'success' : 'error'" size="small">
              {{ duel.is_win ? '勝利' : '敗北' }}
            </v-chip>
            <span class="ml-2 text-body-2">vs {{ duel.opponent_deck_name }}</span>
          </div>
          <span class="text-caption text-grey">{{ formatDate(duel.played_date) }}</span>
        </div>
        <div class="mt-2 text-caption">
          {{ duel.deck_name }} | {{ duel.is_going_first ? '先攻' : '後攻' }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify';
const { xs, sm } = useDisplay();
const isMobile = computed(() => xs.value || sm.value);
</script>
```

**CSS調整:**

```scss
// モバイル用フォントサイズ
@media (max-width: 599px) {
  .v-data-table {
    font-size: 14px;

    td, th {
      padding: 8px 4px !important;
    }
  }
}
```

### 1.2 統計テーブル（相性表）改善

**現状の問題:**
- 横スクロールが発生
- 小さな画面でセルが見づらい

**改善案A: アコーディオン形式**

```vue
<template>
  <!-- モバイル: アコーディオン -->
  <v-expansion-panels v-if="isMobile" variant="accordion">
    <v-expansion-panel v-for="matchup in matchups" :key="matchup.deck">
      <v-expansion-panel-title>
        <div class="d-flex justify-space-between w-100 pr-4">
          <span>{{ matchup.deck }}</span>
          <v-chip size="small" :color="getWinRateColor(matchup.winRate)">
            {{ matchup.winRate }}%
          </v-chip>
        </div>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list density="compact">
          <v-list-item>
            <template #prepend>勝ち</template>
            <template #append>{{ matchup.wins }}</template>
          </v-list-item>
          <v-list-item>
            <template #prepend>負け</template>
            <template #append>{{ matchup.losses }}</template>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <!-- デスクトップ: 従来のテーブル -->
  <v-data-table v-else ... />
</template>
```

**改善案B: 横スクロール許容 + スワイプヒント**

```vue
<template>
  <div class="table-wrapper">
    <div v-if="isMobile" class="swipe-hint text-caption text-center mb-2">
      <v-icon size="small">mdi-gesture-swipe-horizontal</v-icon>
      横にスワイプ
    </div>
    <v-data-table ... />
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
```

---

## Phase 2: フォーム最適化（High）

### 2.1 DuelFormDialog

**現状の問題:**
- ラジオボタンが横並びで押しづらい
- フォーム全体の余白が大きい

**改善案:**

```vue
<template>
  <v-radio-group
    v-model="form.won_coin_toss"
    :inline="!isMobile"
    :class="{ 'mobile-radio-group': isMobile }"
  >
    <v-radio label="勝ち" :value="true" />
    <v-radio label="負け" :value="false" />
  </v-radio-group>
</template>

<style scoped>
.mobile-radio-group {
  .v-radio {
    min-height: 48px; /* タッチターゲット確保 */
  }
}
</style>
```

### 2.2 クイック入力モード（新機能案）

モバイルでの素早い対戦記録入力用の簡易フォーム：

```vue
<template>
  <v-bottom-sheet v-model="showQuickInput">
    <v-card>
      <v-card-title class="text-center">クイック記録</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <v-btn block color="success" size="large" @click="recordWin">
              <v-icon start>mdi-trophy</v-icon>
              勝ち
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn block color="error" size="large" @click="recordLoss">
              <v-icon start>mdi-close-circle</v-icon>
              負け
            </v-btn>
          </v-col>
        </v-row>

        <v-select
          v-model="quickForm.opponentDeck"
          :items="recentOpponentDecks"
          label="相手デッキ"
          class="mt-4"
        />

        <v-btn-toggle v-model="quickForm.isGoingFirst" mandatory class="mt-2 w-100">
          <v-btn value="first" class="flex-grow-1">先攻</v-btn>
          <v-btn value="second" class="flex-grow-1">後攻</v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>
```

---

## Phase 3: レイアウト・スペーシング調整（High）

### 3.1 コンテナpadding

```vue
<!-- 変更前 -->
<v-container class="pa-6">

<!-- 変更後 -->
<v-container class="pa-4 pa-sm-6">
```

### 3.2 チャート高さのレスポンシブ化

```vue
<template>
  <apexchart
    :height="chartHeight"
    ...
  />
</template>

<script setup>
import { useDisplay } from 'vuetify';

const { xs, sm } = useDisplay();

const chartHeight = computed(() => {
  if (xs.value) return 250;
  if (sm.value) return 300;
  return 350;
});
</script>
```

### 3.3 統計カードのグリッド最適化

```vue
<!-- 現状 -->
<v-col cols="6" sm="4" md="2">

<!-- 改善: xsで1行2個を維持しつつ、重要な情報を優先 -->
<v-col cols="6" sm="4" md="2" :order="getCardOrder(stat.key)">
```

---

## Phase 4: ナビゲーション改善（Medium/Low）

### 4.1 ボトムナビゲーション導入

```vue
<!-- AppLayout.vue -->
<template>
  <v-app>
    <AppBar />
    <NavigationDrawer v-if="!isMobile" />

    <v-main>
      <router-view />
    </v-main>

    <!-- モバイル用ボトムナビ -->
    <v-bottom-navigation v-if="isMobile" grow>
      <v-btn to="/dashboard">
        <v-icon>mdi-view-dashboard</v-icon>
        <span>ダッシュボード</span>
      </v-btn>
      <v-btn to="/statistics">
        <v-icon>mdi-chart-bar</v-icon>
        <span>統計</span>
      </v-btn>
      <v-btn @click="showQuickInput = true">
        <v-icon>mdi-plus-circle</v-icon>
        <span>記録</span>
      </v-btn>
      <v-btn to="/decks">
        <v-icon>mdi-cards</v-icon>
        <span>デッキ</span>
      </v-btn>
      <v-btn @click="showMenu = true">
        <v-icon>mdi-dots-horizontal</v-icon>
        <span>その他</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
```

### 4.2 FAB（Floating Action Button）

対戦記録追加用のFAB：

```vue
<v-fab
  v-if="isMobile && canAddDuel"
  location="bottom end"
  color="primary"
  icon="mdi-plus"
  @click="openDuelForm"
/>
```

---

## Phase 5: タッチ操作最適化（Medium）

### 5.1 スワイプアクション

対戦履歴カードでのスワイプ削除/編集：

```vue
<v-slide-group>
  <template v-for="duel in duels">
    <swipe-actions
      :left-actions="[{ icon: 'mdi-pencil', color: 'primary', action: () => edit(duel) }]"
      :right-actions="[{ icon: 'mdi-delete', color: 'error', action: () => delete(duel) }]"
    >
      <DuelCard :duel="duel" />
    </swipe-actions>
  </template>
</v-slide-group>
```

### 5.2 タッチターゲットサイズ

```scss
// グローバルスタイル
@media (max-width: 599px) {
  .v-btn--icon {
    min-width: 44px;
    min-height: 44px;
  }

  .v-list-item {
    min-height: 48px;
  }

  .v-chip {
    min-height: 32px;
  }
}
```

---

## 実装優先順位

### 第1スプリント（Critical + High）
1. DuelTableのモバイルカード表示
2. 統計テーブルのアコーディオン化
3. コンテナpadding調整
4. チャート高さレスポンシブ化

### 第2スプリント（Medium）
1. DuelFormDialogのラジオボタン最適化
2. ダイアログmax-width調整
3. タッチターゲットサイズ統一

### 第3スプリント（Low + 新機能）
1. ボトムナビゲーション導入
2. クイック入力モード
3. スワイプアクション

---

## テスト計画

### デバイス

| デバイス | 画面幅 | 優先度 |
|---------|-------|-------|
| iPhone SE | 375px | 高 |
| iPhone 14 | 390px | 高 |
| iPhone 14 Pro Max | 430px | 中 |
| Galaxy S21 | 360px | 高 |
| iPad Mini | 768px | 中 |

### テスト観点

1. **表示確認**
   - 横スクロールが発生しないこと
   - テキストが読みやすいこと
   - 重要情報がファーストビューに収まること

2. **操作確認**
   - タップ可能な要素が押しやすいこと
   - フォーム入力がスムーズにできること
   - ナビゲーションが直感的であること

3. **パフォーマンス**
   - 初期表示が3秒以内
   - スクロールがスムーズ
   - 入力遅延がないこと

---

## 参考資料

- [Vuetify Display Breakpoints](https://vuetifyjs.com/en/features/display-and-platform/)
- [Material Design - Mobile Guidelines](https://m3.material.io/foundations/layout/understanding-layout)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
