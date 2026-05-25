-- email 検索を大文字小文字無視にするための関数インデックス。
-- login / register / forgot / oauth の検索が `WHERE lower(email) = $1` を使うため、
-- 既存の UNIQUE(email) インデックスは効かず seq scan になる。それを避ける。
--
-- NOTE: 本来は UNIQUE にして大文字違いの重複登録を DB レベルで防ぎたいが、
-- 既存データに lower(email) 重複が 1 組残っている
-- (Supabase 時代の大文字 password 版 + 後から作られた小文字 Google OAuth 版)。
-- その組を統合してから別マイグレーションで UNIQUE 化する。
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
