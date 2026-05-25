# duel-log-app

## Issue / タスク管理

- タスク/チケット管理はしない。 詳細は global `~/.claude/CLAUDE.md` 「task 粒度 / Issue 起票」 参照
- 忘れたくない bug だけ GitHub/Forgejo に ad-hoc 起票 (規律ではなく備忘)

## 認証 / cookie / CSRF を触る変更のチェック (人間・AI 共通)

過去に CSRF cookie の path 設定ミス (`dlog_csrf` を `path=/api` で発行 → SPA が `document.cookie` で読めず全 mutation が 403) で本番が全ユーザー mutation 不能になった。ユニットテストも CI も緑のまますり抜けた。同じ事故を防ぐためのゲート:

- **「ログインできた = 認証 OK」としない。** `/api/auth/login` は CSRF 免除なので、CSRF/cookie が壊れていても通る。**必ず mutation (データ登録 or ログアウト) を 1 つ叩いて確認する** — これが今回壊れていた箇所。
- **JS が読む cookie は path に注意。** `dlog_csrf` は SPA がルート (`/`) で `document.cookie` から読むため **`path=/` 必須**。`path=/api` 等にすると読めず X-CSRF-Token を付けられない。access/refresh は httpOnly でクライアント非読取なので `/api` 系で可。
- **staging で実機確認してから main へ。** staging push で `ci.yml` の `deploy-staging` が VPS API + web を自動デプロイし、`smoke-staging.sh` が login→データ登録→logout を実機で叩く。**このスモークが緑であること**を main 昇格前に確認する (`STAGING_SMOKE_EMAIL/PASSWORD` secret 設定時に有効)。
- cookie 属性 (path / httpOnly / secure / sameSite / domain) を変えたら `packages/api/src/lib/__tests__/cookies.test.ts` と `src/__tests__/auth-flow.integration.test.ts` を必ず見直す。後者はブラウザの path フィルタを模倣し、`path=/api` 回帰で落ちる。
