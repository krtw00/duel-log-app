# デッキアーカイブ・マージ設計

同名のデッキが複数アーカイブされることを防ぐマージ機能。

---

## 実装状況

| 機能 | 状態 |
|------|------|
| 自動マージ（デッキ削除時） | ✅ `deck_service.delete()` |
| プレイヤーデッキの履歴移行 | ✅ `deck_id` 更新 |
| 相手デッキの履歴移行 | ✅ `opponent_deck_id` 更新 |
| 統合元デッキの物理削除 | ✅ マージ後に削除 |
| 管理者向け一括マージ | ✅ `/admin/merge-archived-decks` |
| フロントエンド統合 | ✅ `MaintenanceSection.vue` |

---

## 目的

| 問題 | 解決 |
|------|------|
| 同名デッキの重複 | 自動マージでアーカイブリストを整理 |
| 戦績の分散 | 一つのデッキに集約 |
| ユーザー混乱 | シンプルなUX維持 |

---

## ロジック

### デッキ削除時（`DELETE /decks/{deck_id}`）

```
1. アーカイブ対象デッキ(A)を取得
2. 同名・同タイプのアーカイブ済みデッキ(B)を検索
   - 条件: name一致、is_opponent一致、active=false
3. 分岐:
   - Bが存在 → マージ処理
     - duels.deck_id = A → B に更新
     - duels.opponent_deck_id = A → B に更新
     - A を物理削除
   - Bなし → 通常アーカイブ（A.active = false）
4. コミット
```

---

## データベース操作

| 操作 | 対象 | 説明 |
|------|------|------|
| UPDATE | `duels.deck_id` | A → B に更新 |
| UPDATE | `duels.opponent_deck_id` | A → B に更新 |
| DELETE | `decks` | A を物理削除 |

> 単一トランザクション内で実行

---

## 実装ファイル

| ファイル | 説明 |
|---------|------|
| `backend/app/services/deck_service.py` | `delete()` メソッド |
| `backend/app/api/routers/admin.py` | 一括マージAPI |
| `frontend/src/components/admin/MaintenanceSection.vue` | 管理UI |

---

## API

| エンドポイント | 説明 |
|---------------|------|
| `DELETE /decks/{deck_id}` | 論理削除（自動マージ） |
| `POST /admin/merge-archived-decks` | 管理者向け一括マージ |

---

## 注意事項

| 項目 | 対策 |
|------|------|
| データ整合性 | 単一トランザクション、エラー時ロールバック |
| パフォーマンス | インデックス使用、一括更新 |
| ユーザー体験 | 自動統合の詳細は意識させない |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../04-data/data-model.md | DBスキーマ |
| @../02-architecture/backend-architecture.md | バックエンド構造 |
