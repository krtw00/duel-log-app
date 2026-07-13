---
depends_on: []
tags: [deployment, staging, codenica-vps, ghcr]
ai_summary: "staging ブランチを staging として運用する手順"
---

# Staging環境

> Status: Active
> 最終更新: 2026-07-14

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
| Frontend | codenica-vps `https://duel-log-staging.codenica.dev` | codenica-vps `https://duel-log.codenica.dev` |
| API | codenica-vps Compose (same-origin `/api`) | codenica-vps Compose (same-origin `/api`) |
| DB | codenica-vps PostgreSQL 17 `duellog_staging` | codenica-vps PostgreSQL 17 |
| Auth | Application Auth | Application Auth |

> [!IMPORTANT]
> staging とproductionのDBおよび認証データを共有しないでください。

---

## セットアップ

### 1. staging リソース

- Frontend: codenica-vps の `/var/www/duel-log-staging/`
- API: codenica-vps の `/opt/duel-log-api-staging/` (Docker Compose)
- API image: `ghcr.io/krtw00/duel-log-api` のBuildx生成digestを固定
- DB: codenica-vps Postgres 17 の `duellog_staging`
- 認証は自前 (Supabase 廃止済)

### 2. 環境変数

- ローカル開発: `.env/staging` に staging 用設定を配置
- CI frontend build: `DUEL_LOG_STAGING_ENV_FILE` secretを一時的な`.env/staging`へ展開
- API 側 secret (DB 接続情報等) は VPS の `/opt/duel-log-api-staging/secrets.enc.env` で sops 管理

CIはVPS上のAPI secret値を取得・表示・ローカルコピーしない。既存の暗号化ファイルをCompose起動時に利用し、デプロイ処理はimage referenceの更新、pull、起動に限定する。

### 3. staging へデプロイ

`staging` branch にpushすると、GitHub Actionsの`deploy-staging` jobが次を連続実行する。

1. BuildxでAPI imageをビルドし、`ghcr.io/krtw00/duel-log-api`へpush
2. frontend bundleを`/var/www/duel-log-staging/`へrsync
3. `/opt/duel-log-api-staging/docker-compose.yml`をBuildxが返したdigestへ更新し、pullと`./up.sh`を実行
4. VPS内の`http://127.0.0.1:8001/api/health`と`/api/health/db`を確認
5. public環境でlogin → CSRF cookie読取 (`path=/`) → mutation → logoutのsmokeを実行

| 項目 | 値 |
|------|----|
| Workflow | `.github/workflows/ci.yml` の `deploy-staging` job |
| Frontend | `https://duel-log-staging.codenica.dev` |
| API health | `https://duel-log-staging.codenica.dev/api/health` |

---

## 運用フロー

1. `feature/*` から `staging` にマージ
2. `https://duel-log-staging.codenica.dev` と認証smokeを確認
3. 問題なければ `staging` から `main` に PR
4. `main` マージで production に反映

---

## 補足

- staging の URL は `https://duel-log-staging.codenica.dev`
- ローカル確認は `pnpm dev`
