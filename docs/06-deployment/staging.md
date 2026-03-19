---
depends_on: []
tags: [deployment, staging, google, firebase, cloud-run, supabase]
ai_summary: "develop ブランチを staging として運用する手順"
---

# Staging環境

> Status: Active
> 最終更新: 2026-03-19

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
| Frontend | Firebase Hosting `duel-log-staging` | Firebase Hosting `duel-log` |
| API | Cloud Run `duel-log-api-staging` | Cloud Run `duel-log-api` |
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

### 2. Google staging リソースを分離する

- Firebase Hosting site: `duel-log-staging`
- Cloud Run service: `duel-log-api-staging`
- どちらも production とは別名にする
- API / DB / Auth は production と分離する

### 3. `develop` 向けの staging 環境変数を設定する

- `.vercel/.env.preview.local` に staging 用の Supabase / DB / secret を保存する
- CI では `DUEL_LOG_STAGING_ENV_FILE` secret に同じ内容を複数行で保存する
- ローカルで既存の preview env を使う場合:

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

`develop` へ push した場合は GitHub Actions でも Google staging deploy が走る。

| 項目 | 値 |
|------|----|
| Workflow | `.github/workflows/ci.yml` の `deploy-staging` job |
| Frontend | `https://duel-log-staging.web.app` |
| API | `https://duel-log-api-staging-<hash>.asia-northeast1.run.app/api/health` |

---

## 運用フロー

1. `feature/*` から `develop` にマージ
2. `develop` の Google staging を確認
3. 問題なければ `develop` から `main` に PR
4. `main` マージで production に反映

---

## 補足

- staging の URL は `https://duel-log-staging.web.app`
- ローカル確認は `pnpm supabase:start` と `pnpm dev`
