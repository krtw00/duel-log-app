---
depends_on: []
tags: [deployment, vercel]
ai_summary: "Vercelの詳細設定とCI/CD連携"
---

# Vercel設定

> Status: Active
> 最終更新: 2026-01-23

フロントエンドとAPI Functionsのデプロイ設定

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | Vercel設定のSSoT |
| 対象読者 | 開発者 / 運用担当者 |
| 設定ファイル | `vercel.json` |
| 関連ADR | [ADR-0004](../04-decisions/0004-vercel-fullstack.md) |

> [!NOTE]
> 実際の設定は `vercel.json` がSSoTです。

---

## プロジェクト構成

```
duel-log-app/
├── apps/
│   └── web/              # React フロントエンド
├── packages/
│   └── api/              # Hono API (Vercel Functions)
├── vercel.json           # Vercel設定
└── pnpm-workspace.yaml   # モノレポ設定
```

---

## vercel.json主要設定

| 設定項目 | 値 | 説明 |
|---------|-----|------|
| buildCommand | `pnpm build` | ビルドコマンド |
| outputDirectory | `apps/web/dist` | 出力先 |
| installCommand | `pnpm install` | インストールコマンド |
| framework | `vite` | フレームワーク検出 |

### ルーティング

| パターン | 送信先 | 説明 |
|---------|-------|------|
| `/api/*` | `/packages/api/index.ts` | API Functions |
| `/*` | `/apps/web/dist/$1` | フロントエンド |

---

## 環境変数

### 必須

| 変数 | 説明 | プレフィックス |
|------|------|--------------|
| `VITE_SUPABASE_URL` | Supabase URL | フロントエンド用 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | フロントエンド用 |
| `DATABASE_URL` | PostgreSQL接続文字列 | バックエンド用 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | バックエンド用 |

> [!IMPORTANT]
> フロントエンドで使用する環境変数には `VITE_` プレフィックスが必要。

### オプション

| 変数 | 説明 | デフォルト |
|------|------|-----------| 
| `NODE_ENV` | 実行環境 | `production` |
| `LOG_LEVEL` | ログレベル | `info` |

---

## デプロイ設定

### 初期設定手順

| ステップ | コマンド/操作 |
|---------|-------------|
| 1. ログイン | `npx vercel login` |
| 2. リンク | `npx vercel link` |
| 3. 本番デプロイ | `npx vercel --prod` |

### GitHub連携設定

Vercel Dashboard → Project → Settings → Git

| 設定項目 | 値 |
|---------|-----|
| Production Branch | `main` |
| Preview Branches | `develop`, `feature/*` |

### 環境変数設定

Vercel Dashboard → Project → Settings → Environment Variables

| 環境 | 用途 |
|------|------|
| Production | 本番用の値 |
| Preview | 開発/テスト用の値 |
| Development | ローカル用の値 |

---

## Edge Functions

### 設定概要

| 項目 | 値 |
|------|-----|
| runtime | `edge` |
| エントリポイント | `packages/api/index.ts` |
| フレームワーク | Hono |

### 制限事項

| 項目 | Edge Functions | Node.js Functions |
|------|---------------|-------------------|
| 実行時間 | 30秒 | 10秒（Hobby）/ 60秒（Pro） |
| メモリ | 128MB | 1024MB |
| コールドスタート | 高速 | 中程度 |
| Node.js API | 制限あり | フル |

---

## プレビューデプロイ

### 自動プレビュー

PRごとに自動でプレビューURLが生成される。

| 環境 | URL形式 |
|------|--------|
| Production | `https://duel-log.vercel.app` |
| Preview | `https://duel-log-app-<branch>-<user>.vercel.app` |

---

## トラブルシューティング

### ビルドエラー

| 問題 | 対処法 |
|------|--------|
| 依存関係エラー | `rm -rf node_modules && pnpm install` |
| 型エラー | `pnpm typecheck` でローカル確認 |

### 環境変数が反映されない

| チェック項目 | 確認方法 |
|-------------|---------|
| 変数の存在確認 | Vercel Dashboard |
| プレフィックス確認 | フロントエンド用は `VITE_` |
| 再デプロイ | Vercel Dashboard から実行 |

### Function タイムアウト

| 対処法 | 説明 |
|-------|------|
| クエリ最適化 | DBクエリを見直し |
| 非同期処理 | 重い処理をバックグラウンドに |
| Proプラン | タイムアウト上限が60秒に |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [Supabase設定](./supabase.md) | Supabase設定 |
| [CI/CD設定](./ci-cd.md) | CI/CD設定 |
| [トラブルシューティング](../05-guides/troubleshooting.md) | トラブルシューティング |
