# マイグレーション履歴の問題と対応

## 🔴 重大な問題: 矛盾するマイグレーション

### 問題の概要

以下の3つのマイグレーションが相互に矛盾しており、データベースの状態が不安定になる可能性があります：

1. **142a04659e9c_rename_duel_columns_for_clarity.py** (2025-10-30 11:12)
   - `result` → `is_win`
   - `coin` → `won_coin_toss`
   - `first_or_second` → `is_going_first`

2. **222d71523879_rename_duel_columns_for_schema_alignment.py** (2025-10-30 16:00)
   - `is_win` → `result` （逆に戻す）
   - `won_coin_toss` → `coin` （逆に戻す）
   - `is_going_first` → `first_or_second` （逆に戻す）

3. **4ed32ebe9919_rename_duel_fields_for_clarity.py** (2025-10-31 02:15)
   - `result` → `is_win` （再度変更）
   - `coin` → `won_coin_toss` （再度変更）
   - `first_or_second` → `is_going_first` （再度変更）

### 現在の正しい状態

`app/models/duel.py` に基づく現在の正しいカラム名：
- ✅ `is_win` (Boolean) - 勝敗
- ✅ `won_coin_toss` (Boolean) - コイントス結果
- ✅ `is_going_first` (Boolean) - ターン順

### 影響

- マイグレーション履歴が混乱している
- `alembic downgrade` を実行すると、意図しない状態になる可能性
- 新しい環境でのマイグレーション実行が不安定

## ⚠️ その他の問題

### 1. 外部キーのデフォルト値が無効

**ファイル**: `f853e5404fb3_add_opponentdeck_id_to_duels.py`

```python
op.add_column('duels', sa.Column('opponent_deck_id', sa.Integer(),
    nullable=True, server_default="0"))  # ❌ id=0 のデッキは存在しない
```

**問題**: FK制約違反の可能性

### 2. 空のマイグレーション

以下のマイグレーションファイルは空または重複しており、履歴を複雑化しています：

- `16b01cb8872f_add_email_to_users.py`
- `4a7012b3be58_add_email_to_users.py` （重複）
- `57c26f35d278_fix_timestamp_defaults.py`
- `83290d50b360_add_server_default_to_timestamps.py`
- `563a63256df2_add_timezone_to_duels.py`
- `58c982173971_merge_alembic_history.py`

## 🔧 推奨される対応

### 短期的対応（即時）

1. **本番環境のDBスキーマを確認**
   ```bash
   psql -U user -d duel_log_db -c "\d duels"
   ```

   現在のカラム名が `is_win`, `won_coin_toss`, `is_going_first` であることを確認

2. **マイグレーション履歴の確認**
   ```bash
   alembic current
   alembic history
   ```

3. **データ整合性チェック**
   ```sql
   -- 全対戦データが正常に読み取れるか確認
   SELECT id, is_win, won_coin_toss, is_going_first
   FROM duels
   LIMIT 10;
   ```

### 中期的対応（次回メンテナンス時）

1. **マイグレーション履歴の圧縮**

   新しいクリーンなマイグレーション履歴を作成：
   ```bash
   # バックアップ作成
   pg_dump -U user duel_log_db > backup.sql

   # 現在のスキーマをベースに新しいinitialマイグレーションを作成
   alembic revision --autogenerate -m "consolidated_initial_schema"
   ```

2. **問題のあるマイグレーションを無効化**

   将来的には、矛盾するマイグレーション（222d71523879）を削除し、
   クリーンな履歴に再構築することを推奨します。

### 長期的対応

1. **マイグレーション管理のベストプラクティス導入**
   - マイグレーション作成前にチームレビュー
   - 命名規則の統一
   - カラム名変更は慎重に（一度に完結させる）

2. **データベーススキーマドキュメントの更新**
   - `docs/db-schema.md` を最新化
   - ERD（Entity Relationship Diagram）の作成

## 📝 現在の安全な運用方法

### ✅ DO（推奨）

- 新しいマイグレーションは `alembic revision --autogenerate` で作成
- マイグレーション実行前に必ずバックアップ
- 本番環境では `alembic upgrade head` のみ実行
- ダウングレードは極力避ける

### ❌ DON'T（禁止）

- 手動でのマイグレーション編集（緊急時を除く）
- 本番環境での `alembic downgrade` の実行
- 既に適用されたマイグレーションの削除

## 🆘 トラブルシューティング

### マイグレーションエラーが発生した場合

1. エラーメッセージを確認
2. 現在のデータベース状態を確認: `alembic current`
3. バックアップから復元: `psql -U user duel_log_db < backup.sql`
4. 問題のあるマイグレーションをスキップ: `alembic stamp <revision_id>`

### 参考コマンド

```bash
# 現在のマイグレーション状態
alembic current

# マイグレーション履歴表示
alembic history --verbose

# 特定のリビジョンまでアップグレード
alembic upgrade <revision_id>

# マイグレーションなしで最新とマーク（緊急時のみ）
alembic stamp head
```

---

**作成日**: 2025-11-05
**作成者**: Claude Code Review
**優先度**: P0（即座に対応が必要）
