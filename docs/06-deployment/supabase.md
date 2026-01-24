---
depends_on: []
tags: [deployment, supabase]
ai_summary: "Supabaseの本番環境設定"
---

# Supabase設定

> Status: Active
> 最終更新: 2026-01-23

認証とデータベースの設定ガイド

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | Supabase設定のSSoT |
| 対象読者 | 開発者 / 運用担当者 |
| 関連 | [ADR-0001](../04-decisions/0001-supabase-auth.md) |

---

## Supabaseプロジェクト作成

### 1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 「New Project」をクリック
3. 以下を入力:
   - Name: `duel-log-app`
   - Database Password: 強力なパスワード
   - Region: `Tokyo (ap-northeast-1)`

### 2. 接続情報の取得

Project Settings → API から取得:

| 項目 | 用途 |
|------|------|
| Project URL | `VITE_SUPABASE_URL` |
| anon public key | `VITE_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

Project Settings → Database から取得:

| 項目 | 用途 |
|------|------|
| Connection string | `DATABASE_URL` |

---

## 認証設定

### メール認証

1. Authentication → Providers → Email
2. 以下を設定:
   - Enable Email provider: ON
   - Confirm email: ON（本番）/ OFF（開発）
   - Secure email change: ON

### OAuth設定

#### Google

1. [Google Cloud Console](https://console.cloud.google.com/) でOAuthクライアントを作成
2. 承認済みリダイレクトURI:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → Authentication → Providers → Google
4. Client ID と Client Secret を入力

#### Discord

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリ作成
2. OAuth2 → Redirects に追加:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → Authentication → Providers → Discord
4. Client ID と Client Secret を入力

---

## データベース設定

### RLS（Row Level Security）

```sql
-- usersテーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ読み取り可能
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 自分のデータのみ更新可能
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### duelsテーブルのRLS

```sql
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own duels" ON duels
  FOR ALL USING (auth.uid() = user_id);
```

### decksテーブルのRLS

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own decks" ON decks
  FOR ALL USING (auth.uid() = user_id);
```

---

## マイグレーション

### ローカル開発

```bash
# Supabase CLIでマイグレーション作成
npx supabase migration new add_some_feature

# マイグレーション適用
npx supabase db push

# リセット（注意: データ消失）
npx supabase db reset
```

### 本番適用

```bash
# リモートDBに接続
npx supabase db push --db-url $DATABASE_URL

# または Supabase Dashboard → SQL Editor で実行
```

---

## バックアップ

### 自動バックアップ

- Pro プラン以上: 毎日自動バックアップ
- 保持期間: 7日間

### 手動バックアップ

```bash
# pg_dump でエクスポート
pg_dump $DATABASE_URL > backup.sql

# リストア
psql $DATABASE_URL < backup.sql
```

---

## 環境別設定

### ローカル開発

```bash
# ローカルSupabase起動
npx supabase start

# 接続情報を確認
npx supabase status
```

```
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOiJIUzI1NiIs...
service_role key: eyJhbGciOiJIUzI1NiIs...
```

### 本番環境

Vercel環境変数に設定:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:...@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## セキュリティ

### 必須設定

| 項目 | 設定 |
|------|------|
| RLS | 全テーブルで有効化 |
| anon key | フロントエンドのみで使用 |
| service_role key | バックエンドのみで使用、公開禁止 |

### JWT設定

Authentication → Settings → JWT Settings:

| 項目 | 推奨値 |
|------|--------|
| JWT expiry | 3600（1時間） |
| Enable refresh token rotation | ON |

---

## モニタリング

### Supabase Dashboard

- Database → Reports: クエリパフォーマンス
- Authentication → Users: ユーザー一覧
- Logs: リアルタイムログ

### アラート設定

Project Settings → Integrations → Webhooks でアラート設定可能。

---

## トラブルシューティング

### 接続エラー

```bash
# 接続テスト
psql $DATABASE_URL -c "SELECT 1"

# SSL設定確認
DATABASE_URL="postgresql://...?sslmode=require"
```

### RLSでアクセス拒否

1. RLSポリシーを確認
2. `auth.uid()` が正しく設定されているか確認
3. テスト用にRLSを一時無効化:
   ```sql
   ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
   ```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [Vercel設定](./vercel.md) | Vercel設定 |
| [認証モデル](../03-details/flows.md) | 認証モデル |
| [データモデル](../03-details/data-model.md) | データモデル |
