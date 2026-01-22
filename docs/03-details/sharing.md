---
depends_on: []
tags: [appendix, feature, sharing]
ai_summary: "統計情報共有機能の設計仕様"
---

# 統計共有機能

> Status: Active
> 最終更新: 2026-01-23

URLベースの統計情報共有機能

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | 統計共有機能の設計ドキュメント |
| 状態 | ✅ 実装済み |
| 対象読者 | 開発者 |

---

## 機能

| 機能 | 説明 |
|------|------|
| 共有リンク生成 | フィルター条件・有効期限を指定 |
| 共有統計閲覧 | 認証なしで統計を閲覧 |
| CSVエクスポート | 共有リンク経由でエクスポート |
| 有効期限チェック | アクセス時に検証 |

---

## 共有リンク

### URL形式

```
https://duel-log.vercel.app/shared/{token}
```

### Token

- 128bit URL-safe token
- `crypto.randomBytes(16).toString('base64url')` で生成
- 22文字の文字列

---

## データモデル

### shared_statistics テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| user_id | UUID | FK (users) |
| token | TEXT | UK, 共有トークン |
| filters | JSONB | フィルター条件（期間、ゲームモード等） |
| expires_at | TIMESTAMPTZ | 有効期限（NULL=無期限） |
| created_at | TIMESTAMPTZ | 作成日時 |

### filters JSONB構造

| フィールド | 型 | 説明 |
|-----------|-----|------|
| game_mode | string | ゲームモード（NULL=全モード） |
| from | string | 開始日（ISO 8601） |
| to | string | 終了日（ISO 8601） |
| deck_id | string | デッキID（NULL=全デッキ） |

---

## 生成フロー

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ShareDialog     │────▶│  API Call       │────▶│  Database       │
│ (設定入力)      │     │  POST /shared-  │     │  INSERT         │
└─────────────────┘     │  statistics     │     └─────────────────┘
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Share URL      │
                        │  (クリップボード)│
                        └─────────────────┘
```

---

## 閲覧フロー

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Shared URL     │────▶│  API Call       │────▶│  Validation     │
│  アクセス       │     │  GET /shared-   │     │  - 存在確認     │
└─────────────────┘     │  statistics/:tk │     │  - 有効期限     │
                        └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Statistics     │
                                                │  表示           │
                                                └─────────────────┘
```

---

## 閲覧時の制限

| 機能 | 利用可否 |
|------|:--------:|
| 統計表示 | ✅ |
| フィルタ・グラフ | ✅ |
| CSVエクスポート | ✅ |
| 編集・削除 | ❌ |

---

## API

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/shared-statistics` | POST | 共有リンク生成 |
| `/api/shared-statistics/:token` | GET | 共有統計取得 |
| `/api/shared-statistics/:token` | DELETE | 削除（所有者のみ） |
| `/api/shared-statistics/:token/export/csv` | GET | CSVエクスポート |

---

## セキュリティ

| 項目 | 対策 |
|------|------|
| URL推測攻撃 | 128bit URL-safe token（22文字） |
| データ漏洩 | 統計情報のみ（個人情報なし） |
| ユーザー削除後 | CASCADE DELETE で自動削除 |
| 有効期限 | アクセス時に検証 |

---

## 管理機能

### クリーンアップ

| 対象 | 説明 |
|------|------|
| 期限切れURL | `expires_at < now()` のレコード |
| 孤立URL | ユーザー削除後に残ったレコード |

### 管理者API

| エンドポイント | 説明 |
|---------------|------|
| `POST /api/admin/maintenance/cleanup-expired-shared-urls` | 期限切れ削除 |
| `POST /api/admin/maintenance/cleanup-orphaned-shared-urls` | 孤立URL削除 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [API仕様](../../03-details/api.md) | API仕様 |
| [統計分析](./statistics.md) | 統計分析 |
