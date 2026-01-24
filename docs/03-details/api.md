---
depends_on: []
tags: [details, api, endpoints]
ai_summary: "REST APIエンドポイントとエラーコード仕様"
---

# API設計

> Status: Active
> 最終更新: 2026-01-23

Duel Log AppのAPI仕様概要を記載する。詳細なリクエスト/レスポンススキーマはOpenAPI仕様（`@hono/zod-openapi`定義）がSSoTである。

---

## 基本情報

| 項目 | 内容 |
|------|------|
| ベースURL | `https://duel-log.vercel.app/api` |
| 認証 | Bearer Token (JWT) |
| レスポンス形式 | JSON |

---

## エンドポイント一覧

### 認証 `/api/auth`

ユーザー登録・ログインはSupabase Auth SDKがクライアントで処理する。サーバーAPIはセッション管理のみ提供する。

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| POST | /auth/signout | ログアウト | ✅ |
| POST | /auth/refresh | トークン更新 | ✅ |

### ユーザー `/api/me`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| GET | /me | 自分の情報取得 | ✅ |
| PUT | /me | 自分の情報更新 | ✅ |
| DELETE | /me | アカウント削除 | ✅ |
| GET | /me/export | データエクスポート（CSV） | ✅ |
| POST | /me/import | データインポート（CSV） | ✅ |

### デッキ `/api/decks`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| GET | /decks | デッキ一覧 | ✅ |
| POST | /decks | デッキ作成 | ✅ |
| GET | /decks/:id | デッキ詳細 | ✅ |
| PUT | /decks/:id | デッキ更新 | ✅ |
| DELETE | /decks/:id | デッキ削除 | ✅ |
| PATCH | /decks/:id/archive | アーカイブ | ✅ |
| PATCH | /decks/:id/unarchive | アーカイブ解除 | ✅ |

### デュエル `/api/duels`

GET /duels は以下のクエリパラメータでフィルタに対応する: `game_mode`, `deck_id`, `from`, `to`, `from_timestamp`, `limit`, `offset`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| GET | /duels | デュエル一覧（フィルタ対応） | ✅ |
| POST | /duels | デュエル作成 | ✅ |
| GET | /duels/:id | デュエル詳細 | ✅ |
| PUT | /duels/:id | デュエル更新 | ✅ |
| DELETE | /duels/:id | デュエル削除 | ✅ |
| POST | /duels/import | CSVインポート | ✅ |
| GET | /duels/export | CSVエクスポート | ✅ |

### 統計 `/api/statistics`

全エンドポイントで `game_mode`, `from`, `to`, `from_timestamp` クエリパラメータによるフィルタに対応する。

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| GET | /statistics/overview | 概要統計 | ✅ |
| GET | /statistics/win-rate | 勝率統計 | ✅ |
| GET | /statistics/matchups | 相性表 | ✅ |
| GET | /statistics/streaks | 連勝/連敗 | ✅ |
| GET | /statistics/value-sequence | ランク/レート推移 | ✅ |

### 共有統計 `/api/shared-statistics`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| POST | /shared-statistics | 共有URL作成 | ✅ |
| GET | /shared-statistics/:token | 共有統計取得 | - |
| DELETE | /shared-statistics/:token | 共有削除 | ✅ |
| GET | /shared-statistics/:token/export/csv | CSVエクスポート | - |

### 管理者 `/api/admin`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| GET | /admin/users | ユーザー一覧 | ✅ (admin) |
| PUT | /admin/users/:id/status | ステータス変更 | ✅ (admin) |
| GET | /admin/statistics | 全体統計 | ✅ (admin) |
| POST | /admin/maintenance/cleanup-expired-shared-urls | 期限切れ共有URL削除 | ✅ (admin) |
| POST | /admin/maintenance/cleanup-orphaned-shared-urls | 孤立共有URL削除 | ✅ (admin) |

### フィードバック `/api/feedback`

| メソッド | パス | 説明 | 認証 |
|---------|------|------|:----:|
| POST | /feedback | フィードバック送信 | ✅ |

---

## レスポンス形式

| パターン | 構造 |
|---------|------|
| 単一リソース | `{ "data": { ... } }` |
| リスト | `{ "data": [...], "pagination": { "total", "limit", "offset" } }` |

---

## エラーレスポンス

| フィールド | 型 | 説明 |
|-----------|-----|------|
| error.code | string | エラーコード（例: `VALIDATION_ERROR`） |
| error.message | string | エラーメッセージ |
| error.details | array | フィールドごとのエラー詳細（オプション） |

### エラーコード一覧

| HTTP | コード | 説明 |
|------|--------|------|
| 400 | `VALIDATION_ERROR` | 入力値が不正 |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 401 | `INVALID_TOKEN` | トークンが無効または期限切れ |
| 403 | `FORBIDDEN` | アクセス権限なし |
| 403 | `ADMIN_REQUIRED` | 管理者権限が必要 |
| 403 | `DEBUGGER_REQUIRED` | デバッガー権限が必要 |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 409 | `CONFLICT` | リソースの競合 |
| 422 | `INVALID_OPERATION` | 不正な操作 |
| 429 | `RATE_LIMIT_EXCEEDED` | レート制限超過 |
| 500 | `INTERNAL_ERROR` | 内部エラー |

---

## 関連ドキュメント

- [data-model.md](./data-model.md) - データモデル
- [flows.md](./flows.md) - 主要フロー
- [structure.md](../02-architecture/structure.md) - コンポーネント構成
