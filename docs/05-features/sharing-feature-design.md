# 共有機能設計

URLベースの統計情報共有機能。認証なしで統計情報を閲覧可能。

---

## 実装状況

| 機能 | 状態 |
|------|------|
| 共有リンク生成 | ✅ 年月・ゲームモード・有効期限指定 |
| 共有統計閲覧 | ✅ フィルタ・グラフ表示対応 |
| CSVエクスポート | ✅ 共有リンク経由でエクスポート可能 |
| 有効期限チェック | ✅ アクセス時に検証 |
| 管理パネル（クリーンアップ） | ✅ 期限切れ・孤立URL削除 |
| レガシーテーブル移行 | ❌ `sharedurls` → `shared_statistics` |

---

## データベース

### shared_statistics テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | SERIAL | PK |
| share_id | VARCHAR(22) | UK, 共有ID (128bit URL-safe token) |
| user_id | INTEGER | FK (users) |
| year | INTEGER | 対象年 |
| month | INTEGER | 対象月 |
| game_mode | VARCHAR(10) | RANK/RATE/EVENT/DC |
| expires_at | TIMESTAMPTZ | 有効期限 (NULL=無期限) |

> `share_id` は `secrets.token_urlsafe(16)` で生成（22文字）

### レガシー: sharedurls（削除予定）

移行後に削除予定。

---

## 機能詳細

### 共有リンク生成

```
URL形式: https://duel-log.app/shared-stats/{share_id}
```

| 設定項目 | 説明 |
|---------|------|
| 年月 | 対象の年・月 |
| ゲームモード | RANK/RATE/EVENT/DC |
| 有効期限 | 無期限 or 日数指定 |

### 共有統計閲覧

| 機能 | 制限 |
|------|------|
| 統計表示 | 認証不要 |
| フィルタ・グラフ | ✅ |
| CSVエクスポート | ✅ |
| 編集・削除 | ❌ 閲覧のみ |

---

## API

| エンドポイント | 説明 |
|---------------|------|
| `POST /shared-statistics/` | 共有リンク生成 |
| `GET /shared-statistics/{share_id}` | 共有統計取得 |
| `DELETE /shared-statistics/{share_id}` | 削除（所有者のみ） |
| `GET /shared-statistics/{share_id}/export/csv` | CSVエクスポート |

### 管理者API

| エンドポイント | 説明 |
|---------------|------|
| `POST /admin/maintenance/scan-orphaned-shared-urls` | 孤立URLスキャン |
| `POST /admin/maintenance/cleanup-orphaned-shared-urls` | 孤立URL削除 |
| `POST /admin/maintenance/scan-expired-shared-urls` | 期限切れスキャン |
| `POST /admin/maintenance/cleanup-expired-shared-urls` | 期限切れ削除 |

---

## 実装ファイル

| バックエンド | 説明 |
|-------------|------|
| `app/models/shared_statistics.py` | モデル |
| `app/schemas/shared_statistics.py` | スキーマ |
| `app/services/shared_statistics_service.py` | サービス |
| `app/api/routers/shared_statistics.py` | ルーター |

| フロントエンド | 説明 |
|---------------|------|
| `src/stores/shared_statistics.ts` | Pinia ストア |
| `src/views/SharedStatisticsView.vue` | 共有統計ビュー |
| `src/components/shared/ShareStatsDialog.vue` | 共有ダイアログ |

---

## セキュリティ

| 項目 | 対策 |
|------|------|
| URL推測攻撃 | 128bit URL-safe token |
| データ漏洩 | 統計情報のみ（個人情報なし） |
| ユーザー削除後 | CASCADE DELETE で自動削除 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @./admin-panel-design.md | 管理パネル設計 |
| @../04-data/data-model.md | DBスキーマ |
