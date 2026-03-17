---
depends_on: []
tags: [deployment, staging, vercel, supabase]
ai_summary: "develop ブランチを staging として運用する手順"
---

# Staging環境

> Status: Active
> 最終更新: 2026-03-17

`develop` ブランチを staging 環境として運用するための手順。

---

## 目的

- `develop` で本番一歩手前の確認をする
- `main` は本番リリース専用にする
- staging と production で DB / Auth を分離する

---

## 推奨構成

| レイヤー | staging | production |
|---------|---------|------------|
| Git ブランチ | `develop` | `main` |
| Vercel | Preview | Production |
| Supabase | staging 用プロジェクト | production 用プロジェクト |

> [!IMPORTANT]
> staging で production の Supabase を共有しないでください。

---

## セットアップ

### 1. Supabase プロジェクトを分離する

- production とは別に staging 用 Supabase プロジェクトを作成
- `DATABASE_URL`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

必要な値のひな形は `.env.staging.example` を参照。

### 2. Vercel Preview を staging として固定する

Vercel Dashboard → Project → Settings → Git:

| 設定 | 値 |
|------|----|
| Production Branch | `main` |
| Preview Branches | `develop`, `feature/*` |

### 3. `develop` 向けの Preview 環境変数を設定する

Vercel Dashboard → Project → Settings → Environment Variables:

- `Preview` 環境に staging 用の Supabase 値を設定
- Branch 指定が使える場合は `develop` に絞る

CLI で pull する場合:

```bash
pnpm staging:pull
```

### 4. staging 用ビルド確認

```bash
pnpm staging:build
```

### 5. staging へデプロイ

```bash
pnpm staging:deploy
```

`develop` へ push した場合は GitHub Actions でも staging deploy が走り、固定 alias を更新する。

| 項目 | 値 |
|------|----|
| Workflow | `.github/workflows/ci.yml` の `deploy-staging` job |
| Alias | `https://duel-log-staging-krtw00s-projects.vercel.app` |

---

## 運用フロー

1. `feature/*` から `develop` にマージ
2. `develop` の Vercel Preview を staging として確認
3. 問題なければ `develop` から `main` に PR
4. `main` マージで production に反映

---

## 補足

- staging の URL は `https://duel-log-staging-krtw00s-projects.vercel.app`
- ローカル確認は `pnpm supabase:start` と `pnpm dev`
