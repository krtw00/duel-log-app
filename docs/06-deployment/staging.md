---
depends_on: []
tags: [deployment, staging, google, firebase, codenica-vps]
ai_summary: "staging ブランチを staging として運用する手順"
---

# Staging環境

> Status: Active
> 最終更新: 2026-05-16

`staging` ブランチを staging 環境として運用するための手順。

---

## 目的

- `staging` で本番一歩手前の確認をする
- `main` は本番リリース専用にする
- staging と production で DB / Auth を分離する

---

## 推奨構成

| レイヤー | staging | production |
|---------|---------|------------|
| Git ブランチ | `staging` | `main` |
| Frontend | Firebase Hosting `duel-log-staging` | Firebase Hosting `duel-log` |
| API | codenica-vps `https://duel-log-api-staging.codenica.dev` | Cloud Run `duel-log-api` |
| DB | codenica-vps Postgres 17 `duellog_staging` | Cloud SQL (Phase 3 で VPS 移行予定) |
| Supabase | (廃止、自前認証へ移行済) | production 用プロジェクト |

> [!IMPORTANT]
> staging で production の Supabase を共有しないでください。

---

## セットアップ

### 1. staging リソース

- Firebase Hosting site: `duel-log-staging`
- API: codenica-vps の `/opt/duel-log-api-staging/` (docker compose, image は Artifact Registry の `apps/api:staging-*`)
- DB: codenica-vps Postgres 17 の `duellog_staging`
- 認証は自前 (Supabase 廃止済)

### 2. 環境変数

- ローカル: `.env/staging` に staging 用 secret を配置
- CI: `DUEL_LOG_STAGING_ENV_FILE` secret に同じ内容を複数行で保存
- API 側 secret (DB 接続情報等) は VPS の `/opt/duel-log-api-staging/secrets.enc.env` で sops 管理

### 3. staging へデプロイ

`staging` branch に push すると GitHub Actions の `deploy-staging` job が Firebase Hosting に新 bundle を配置する。 API 側は VPS で個別に image を更新する (`./up.sh`)。

| 項目 | 値 |
|------|----|
| Workflow | `.github/workflows/ci.yml` の `deploy-staging` job |
| Frontend | `https://duel-log-staging.web.app` |
| API | `https://duel-log-api-staging.codenica.dev/api/health` |

---

## 運用フロー

1. `feature/*` から `staging` にマージ
2. `staging` の Google staging を確認
3. 問題なければ `staging` から `main` に PR
4. `main` マージで production に反映

---

## 補足

- staging の URL は `https://duel-log-staging.web.app`
- ローカル確認は `pnpm dev`
