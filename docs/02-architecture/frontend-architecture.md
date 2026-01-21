# フロントエンドアーキテクチャ

Vue 3 + TypeScript + Vuetify 3によるSPA。

## 技術スタック

| 技術 | 用途 |
|------|------|
| Vue 3 | フレームワーク（Composition API） |
| TypeScript | 言語 |
| Vite | ビルドツール |
| Vuetify 3 | UIフレームワーク |
| Pinia | 状態管理 |
| Vue Router | ルーティング |
| Axios | HTTP通信 |
| ApexCharts | チャート描画 |

---

## ディレクトリ構造

| ディレクトリ | 役割 |
|-------------|------|
| `src/views/` | ページコンポーネント |
| `src/components/` | 再利用可能なUIコンポーネント |
| `src/composables/` | Composition API用の再利用ロジック |
| `src/stores/` | Pinia状態管理 |
| `src/services/` | APIクライアント |
| `src/router/` | ルーティング設定 |
| `src/types/` | TypeScript型定義 |
| `src/plugins/` | Vuetifyなどのプラグイン設定 |

---

## 主要コンポーネント

### Views（ページ）

| View | 機能 |
|------|------|
| `DashboardView` | メインダッシュボード |
| `DecksView` | デッキ管理 |
| `StatisticsView` | 詳細統計（フィルター付き） |
| `ProfileView` | ユーザープロフィール |
| `StreamerPopupView` | 配信用リアルタイム統計表示 |
| `SharedStatisticsView` | 統計情報の公開共有 |

### Components

| カテゴリ | 例 |
|---------|-----|
| `common/` | LoadingOverlay, ToastNotification |
| `layout/` | AppBar |
| `duel/` | DuelTable, DuelFormDialog |

---

## 状態管理（Pinia）

| ストア | 責務 |
|--------|------|
| `auth` | 認証状態、ユーザー情報 |
| `decks` | デッキ一覧、CRUD |
| `duels` | 対戦履歴、CRUD |
| `statistics` | 統計データ |
| `notification` | トースト通知 |
| `loading` | ローディング状態 |

---

## Composables

| ファイル | 機能 |
|----------|------|
| `useCSVOperations` | CSV インポート/エクスポート |
| `useChartOptions` | ApexCharts共通設定 |
| `useDashboardFilters` | ダッシュボードフィルター |
| `useDateTimeFormat` | 日時フォーマット |
| `useDeckResolution` | デッキID→名前解決 |
| `useDuelFormValidation` | フォームバリデーション |
| `useDuelManagement` | デュエルCRUD |
| `useStatsCalculation` | 統計計算 |

---

## ルーティング

認証ガード付きのVue Router。

| 設定 | 説明 |
|------|------|
| `meta.requiresAuth` | 認証必須ルートのマーク |
| `beforeEach` | 認証状態チェック、未認証時はログインへリダイレクト |

---

## API通信

`src/services/api.ts`でAxiosインスタンスを一元管理。

| 設定 | 説明 |
|------|------|
| ベースURL | `VITE_API_URL`環境変数 |
| 認証 | `Authorization: Bearer <token>`ヘッダー |
| フォールバック | `withCredentials: true`でCookie認証もサポート |
| エラーハンドリング | インターセプターでグローバル処理 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./backend-architecture.md | バックエンド詳細 |
| @../04-data/data-model.md | データベーススキーマ |
| @../03-core-concepts/error-handling.md | エラーハンドリング |
