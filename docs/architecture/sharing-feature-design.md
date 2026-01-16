# 共有機能設計

## 概要

ユーザーが自身の対戦統計情報を第三者と共有するための機能。URLベースの共有リンクを発行し、認証なしで統計情報を閲覧できる。

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 共有リンク生成 | ✅ 実装済み | 年月・ゲームモード・有効期限指定 |
| 共有統計閲覧 | ✅ 実装済み | フィルタ・グラフ表示対応 |
| CSVエクスポート | ✅ 実装済み | 共有リンク経由でエクスポート可能 |
| 有効期限チェック | ✅ 実装済み | アクセス時に検証 |
| 期限切れURL削除 | ❌ 未実装 | 管理パネルから一括削除 |
| 孤立URL削除 | ❌ 未実装 | 管理パネルから削除 |
| レガシーテーブル移行 | ❌ 未実装 | `sharedurls` → `shared_statistics` |

## アーキテクチャ

### データベース構造

#### 現行テーブル: `shared_statistics`

```sql
CREATE TABLE shared_statistics (
    id SERIAL PRIMARY KEY,
    share_id VARCHAR(32) NOT NULL UNIQUE,  -- URL-safe token (128bit)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    game_mode VARCHAR(10) NOT NULL,  -- RANK, RATE, EVENT, DC
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- NULL = 無期限

    INDEX idx_shared_statistics_user_id (user_id),
    INDEX idx_shared_statistics_share_id (share_id)
);
```

#### レガシーテーブル: `sharedurls`（削除予定）

```sql
-- 旧設計。データ移行後に削除予定。
CREATE TABLE sharedurls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    year_month VARCHAR(7),  -- "2025-01" 形式
    url VARCHAR(255) UNIQUE,  -- UUID形式
    createdat TIMESTAMPTZ,
    updatedat TIMESTAMPTZ
);
```

### 移行計画

1. **データ確認**: `sharedurls` に有効なデータが存在するか確認
2. **データ移行**: 存在する場合、`shared_statistics` 形式に変換して移行
3. **リレーション削除**: `User.sharedurls` リレーションを削除
4. **モデル削除**: `app/models/sharedUrl.py` を削除
5. **テーブル削除**: マイグレーションで `sharedurls` テーブルを削除

---

## 機能詳細

### 1. 共有リンク生成

**フロー:**
1. ユーザーが統計画面から「共有」ボタンをクリック
2. ダイアログで年月・ゲームモード・有効期限を選択
3. `share_id`（URL-safe 128bit token）を生成
4. 共有URLをクリップボードにコピー

**URL形式:**
```
https://duel-log.app/shared-stats/{share_id}
```

**セキュリティ:**
- `share_id`: `secrets.token_urlsafe(16)` で生成（128bit エントロピー）
- ブルートフォース耐性あり（推測困難）

### 2. 共有統計閲覧

**機能:**
- 認証不要でアクセス可能
- 元の統計画面と同等の表示（ダッシュボード・詳細統計）
- フィルタ機能（期間・デッキ）
- CSVエクスポート

**制限:**
- 有効期限切れの場合はエラー表示
- 編集・削除は不可（閲覧のみ）

### 3. 有効期限

**仕様:**
- `expires_at`: NULL の場合は無期限
- アクセス時に `expires_at < NOW()` をチェック
- 期限切れの場合は 404 または専用エラーページ

**クリーンアップ:**
- 管理パネルから期限切れURLを一括削除
- 自動削除は実装しない（DBサイズへの影響は軽微）

---

## ユーザー操作

### ユーザー側の操作

| 操作 | 方法 | 備考 |
|------|------|------|
| リンク生成 | 統計画面 → 共有ダイアログ | 年月・モード・期限を選択 |
| リンク閲覧 | URLを共有 | 認証不要 |
| リンク削除 | なし | 有効期限で自動失効 |
| リンク一覧 | なし | 管理UIは不要（ユーザー要望なし） |

### 管理者側の操作

| 操作 | 方法 | 備考 |
|------|------|------|
| 孤立URL削除 | 管理パネル → メンテナンス | ユーザー削除後の残存URL |
| 期限切れURL一括削除 | 管理パネル → メンテナンス | DBクリーンアップ |
| 全URL一覧 | なし | プライバシー考慮で実装しない |

---

## API設計

### 既存API（変更なし）

#### POST /shared-statistics/
共有リンクを生成

#### GET /shared-statistics/{share_id}
共有統計を取得

#### DELETE /shared-statistics/{share_id}
共有リンクを削除（所有者のみ）

#### GET /shared-statistics/{share_id}/export/csv
CSVエクスポート

### 管理者API（新規）

#### POST /admin/maintenance/scan-orphaned-shared-urls

孤立した共有URLをスキャン

> **Note:** 現在はユーザー削除時にCASCADE DELETEが動作するため、
> 通常は孤立URLは発生しない。この機能は過去データや異常系の対応用。

**レスポンス:**
```json
{
  "orphaned_count": 15,
  "details": [
    {
      "share_id": "abc123...",
      "original_user_id": 42,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /admin/maintenance/cleanup-orphaned-shared-urls

孤立した共有URLを削除

**レスポンス:**
```json
{
  "success": true,
  "deleted_count": 15,
  "message": "15件の孤立した共有URLを削除しました"
}
```

#### POST /admin/maintenance/scan-expired-shared-urls

期限切れの共有URLをスキャン

**レスポンス:**
```json
{
  "expired_count": 45,
  "oldest_expired": "2024-06-01T00:00:00Z"
}
```

#### POST /admin/maintenance/cleanup-expired-shared-urls

期限切れの共有URLを一括削除

**レスポンス:**
```json
{
  "success": true,
  "deleted_count": 45,
  "message": "45件の期限切れ共有URLを削除しました"
}
```

---

## 実装ファイル

### バックエンド

| ファイル | 説明 |
|---------|------|
| `app/models/shared_statistics.py` | SharedStatistics モデル |
| `app/models/sharedUrl.py` | **削除予定** SharedUrl モデル |
| `app/schemas/shared_statistics.py` | Pydantic スキーマ |
| `app/services/shared_statistics_service.py` | 共有機能サービス |
| `app/api/routers/shared_statistics.py` | 共有API ルーター |

### フロントエンド

| ファイル | 説明 |
|---------|------|
| `src/stores/shared_statistics.ts` | Pinia ストア |
| `src/views/SharedStatisticsView.vue` | 共有統計ビュー |
| `src/components/shared/ShareStatsDialog.vue` | 共有ダイアログ |

---

## 今後の実装タスク

### 優先度: 高

1. **レガシーテーブル移行**
   - `sharedurls` のデータを確認
   - 必要に応じて `shared_statistics` へ移行
   - `sharedurls` テーブル・モデル・リレーションを削除

2. **管理パネル: 共有URL クリーンアップ**
   - 孤立URL スキャン・削除 API
   - 期限切れURL スキャン・削除 API
   - フロントエンド UI

### 優先度: 低

3. **レート制限**
   - 共有URL アクセスへのレート制限追加
   - ブルートフォース対策の強化

---

## セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| URL推測攻撃 | 128bit URL-safe token で十分なエントロピー確保 |
| データ漏洩 | 統計情報のみ公開、個人情報は含まない |
| 無期限リンク | ユーザー判断で設定可能、管理者が期限切れを定期削除 |
| ユーザー削除後 | CASCADE DELETE で自動削除（✅ 実装済み） |

---

## 参考リンク

- [管理パネル設計](./admin-panel-design.md)
- [DBスキーマ](./db-schema.md)
