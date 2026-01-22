---
depends_on: []
tags: [guide, deployment]
ai_summary: "Vercel+Supabaseへのデプロイ手順"
---

# デプロイガイド

> Status: Active
> 最終更新: 2026-01-23

Vercel + Supabase へのデプロイ手順を記載する。

---

## デプロイ構成

| サービス | プラットフォーム | URL |
|---------|----------------|-----|
| フロントエンド + API | Vercel | https://duel-log.vercel.app |
| データベース + 認証 | Supabase | (内部接続) |

---

## 初回デプロイ

### 1. Supabaseプロジェクト作成

1. Supabase Dashboardにアクセス
2. 「New Project」でプロジェクト作成
3. Project URL、anon key、service_role keyを取得

### 2. データベースセットアップ

```bash
npx drizzle-kit generate
DATABASE_URL="postgresql://..." npx drizzle-kit migrate
```

### 3. Vercelプロジェクト作成

1. Vercel Dashboardにアクセス
2. GitHubリポジトリを選択
3. Framework Preset: Vite を選択
4. 環境変数を設定
5. 「Deploy」をクリック

### 4. 環境変数

| 変数名 | 説明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | PostgreSQL接続文字列 |

---

## 継続的デプロイ

```bash
# mainブランチにプッシュ → 本番デプロイ
git push origin main

# プルリクエスト → プレビューデプロイ
git push origin feature/xxx
```

---

## 関連ドキュメント

- [vercel.md](../06-deployment/vercel.md) - Vercel詳細設定
- [supabase.md](../06-deployment/supabase.md) - Supabase詳細設定
- [troubleshooting.md](./troubleshooting.md) - トラブルシューティング
