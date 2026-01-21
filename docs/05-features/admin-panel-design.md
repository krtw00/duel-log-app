# 管理者画面設計

管理者がシステム全体を監視・管理するためのWebベースの管理画面。

---

## 実装状況

| フェーズ | 機能 | 状態 |
|---------|------|------|
| フェーズ1 | ユーザー管理 | ✅ 完了 |
| フェーズ2 | システム統計 | ✅ 完了 |
| フェーズ3 | DBメンテナンス | ✅ 完了 |
| フェーズ4 | メタ分析 | ✅ 完了 |

---

## アクセス制御

| 項目 | 実装 |
|------|------|
| 認証 | JWT Cookie認証 |
| 認可 | `users.is_admin` フラグ |
| バックエンド | `get_admin_user()` |
| フロントエンド | Vue Routerガード |

---

## フェーズ1: ユーザー管理

### 機能

| 機能 | 状態 |
|------|------|
| ユーザー一覧 | ✅ ページネーション、ソート、検索、フィルタ |
| 管理者権限付与/削除 | ✅ 最低1人の管理者保護 |
| ユーザー詳細ビュー | ✅ 基本情報、利用状況、機能利用 |
| アカウント状態管理 | ✅ active/suspended/deleted |
| パスワードリセット | ✅ Supabase Auth連携 |

### API

| エンドポイント | 説明 |
|---------------|------|
| `GET /admin/users` | ユーザー一覧（ページネーション対応） |
| `GET /admin/users/{id}` | ユーザー詳細 |
| `PUT /admin/users/{id}/admin-status` | 管理者権限変更 |
| `PUT /admin/users/{id}/status` | アカウント状態変更 |
| `POST /admin/users/{id}/reset-password` | パスワードリセット |

---

## フェーズ2: システム統計

### 機能

| 機能 | 表示内容 |
|------|---------|
| 統計カード | 総ユーザー数、総デッキ数、総対戦数、アクティブユーザー |
| グラフ | 対戦数推移（折れ線）、ゲームモード別（円）、登録数推移（棒） |

### API

| エンドポイント | 説明 |
|---------------|------|
| `GET /admin/statistics/overview` | 統計概要 |
| `GET /admin/statistics/duels-timeline` | 対戦数推移 |
| `GET /admin/statistics/user-registrations` | ユーザー登録推移 |

---

## フェーズ3: DBメンテナンス

### 機能

| 機能 | 状態 |
|------|------|
| アーカイブデッキマージ | ✅ 同名デッキ統合 |
| 孤立デッキ削除 | ✅ 対戦履歴なしデッキ |
| 孤立共有URL削除 | ✅ ユーザー削除後の残存 |
| 期限切れ共有URL削除 | ✅ 一括クリーンアップ |

### API

| エンドポイント | 説明 |
|---------------|------|
| `POST /admin/merge-archived-decks` | デッキマージ |
| `POST /admin/maintenance/scan-orphaned-data` | 孤立データスキャン |
| `POST /admin/maintenance/cleanup-orphaned-data` | 孤立データ削除 |
| `POST /admin/maintenance/scan-orphaned-shared-urls` | 孤立URLスキャン |
| `POST /admin/maintenance/cleanup-orphaned-shared-urls` | 孤立URL削除 |
| `POST /admin/maintenance/scan-expired-shared-urls` | 期限切れスキャン |
| `POST /admin/maintenance/cleanup-expired-shared-urls` | 期限切れ削除 |

---

## フェーズ4: メタ分析

### 機能

| 機能 | 説明 |
|------|------|
| 人気デッキランキング | デッキ名、使用者数、勝率、使用率 |
| 使用率推移 | 上位デッキの日別/週別グラフ |
| ゲームモード別統計 | 対戦数比率、アクティブユーザー |

### API

| エンドポイント | 説明 |
|---------------|------|
| `GET /admin/meta/popular-decks` | 人気デッキランキング |
| `GET /admin/meta/deck-trends` | 使用率推移 |
| `GET /admin/meta/game-mode-stats` | モード別統計 |

### プライバシー

| 項目 | 対策 |
|------|------|
| 集計のみ | 個別ユーザーデータは非公開 |
| 最小閾値 | 使用回数が少ないデッキは除外 |
| 匿名化 | ユーザー名は一切表示しない |

---

## 実装ファイル

| バックエンド | 説明 |
|-------------|------|
| `app/api/routers/admin.py` | 管理者API |
| `app/api/deps.py` | `get_admin_user()` |
| `app/services/admin_user_service.py` | ユーザー管理 |
| `app/services/admin_statistics_service.py` | 統計・メンテナンス |
| `app/services/admin_meta_service.py` | メタ分析 |
| `app/schemas/admin.py` | スキーマ |

| フロントエンド | 説明 |
|---------------|------|
| `src/views/AdminView.vue` | 管理者画面 |
| `src/components/admin/UserManagementSection.vue` | ユーザー管理 |
| `src/components/admin/UserDetailDialog.vue` | ユーザー詳細 |
| `src/components/admin/StatisticsSection.vue` | 統計 |
| `src/components/admin/MaintenanceSection.vue` | メンテナンス |
| `src/components/admin/MetaAnalysisSection.vue` | メタ分析 |
| `src/services/adminApi.ts` | APIクライアント |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./archive-deck-merge-design.md | デッキマージ設計 |
| @./sharing-feature-design.md | 共有機能設計 |
| @../02-architecture/backend-architecture.md | バックエンド構造 |
