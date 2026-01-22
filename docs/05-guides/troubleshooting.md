---
depends_on: []
tags: [guide, troubleshooting]
ai_summary: "よくある問題と解決方法"
---

# トラブルシューティング

> Status: Active
> 最終更新: 2026-01-23

よくある問題と解決方法を記載する。

---

## 開発環境

### Supabaseが起動しない

```bash
# Dockerが起動しているか確認
docker ps

# Supabaseをリセット
npx supabase stop --no-backup
npx supabase start
```

### ポート競合

```bash
# 使用中のプロセスを確認
lsof -i :5173

# プロセスを終了
kill -9 <PID>
```

### 依存関係エラー

```bash
# node_modules削除・再インストール
rm -rf node_modules
pnpm install
```

---

## 認証関連

### ログインできない

| 確認事項 | 対処 |
|---------|------|
| OAuth設定 | Supabase DashboardでOAuth設定を確認 |
| リダイレクトURL | 正しいURLが設定されているか確認 |
| 環境変数 | `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`を確認 |

### 401 Unauthorized

| 確認事項 | 対処 |
|---------|------|
| JWTトークン | 有効期限を確認 |
| Authorizationヘッダー | `Bearer <token>` 形式か確認 |

---

## API関連

### 500 Internal Server Error

| 確認事項 | 対処 |
|---------|------|
| Vercel Function Logs | エラーログを確認 |
| データベース接続 | `DATABASE_URL`を確認 |
| 環境変数 | Vercel Dashboardで確認 |

### タイムアウト

| 確認事項 | 対処 |
|---------|------|
| 実行時間制限 | Vercel Hobby: 10秒制限 |
| クエリ最適化 | N+1クエリがないか確認 |

---

## フロントエンド関連

### データが更新されない

TanStack Queryのキャッシュ無効化を確認：
- `invalidateQueries`が正しく呼ばれているか
- キャッシュキーが一致しているか

---

## デバッグツール

| ツール | 用途 |
|--------|------|
| React Query Devtools | クエリ状態・キャッシュ確認 |
| Vercel Logs | Function実行ログ |
| Supabase Logs | Auth/Postgresログ |

---

## 関連ドキュメント

- [quickstart.md](./quickstart.md) - 環境セットアップ
- [deployment.md](./deployment.md) - デプロイガイド
- [api.md](../03-details/api.md) - API設計（エラーコード）
