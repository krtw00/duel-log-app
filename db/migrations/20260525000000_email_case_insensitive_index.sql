-- email を大文字小文字無視で扱うための UNIQUE 関数インデックス。
-- login / register / forgot / oauth は入力を小文字化して `WHERE lower(email) = $1`
-- で検索する。UNIQUE 化により大文字違いの重複登録を DB レベルで防ぐ。
--
-- 2026-05-25: 既存データの大文字混じり email 15 件は小文字化済み。残る lower(email)
-- 重複 1 組 (大文字 password 版 + 小文字 Google 版、同一 Gmail) はデッキを現用アカウント
-- に移して統合済み。本番 duellog / staging duellog_staging には手動適用済み。
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
