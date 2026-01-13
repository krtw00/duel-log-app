# デプロイメント設定手順

このガイドに従って、VercelとRenderに環境変数を設定してください。

---

## 取得済みの情報

以下の情報は既に確認済みです：

### Supabaseプロジェクト情報

- **プロジェクトURL**: `https://vdzyixwbikouwkhvvwkn.supabase.co`
- **ANON Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYwODcsImV4cCI6MjA4Mzg0MjA4N30.Mpgux_8DSAebHK1N6UaayANmGL41q9w2U1kMEW_gcPA`
- **データベースホスト**: `db.vdzyixwbikouwkhvvwkn.supabase.co`
- **リージョン**: Tokyo (ap-northeast-1)

### Renderサービス情報

- **サービスURL**: `https://duel-log-app.onrender.com`
- **サービスID**: `srv-d3fr7qu3jp1c73f4k49g`

---

## 必要な追加情報

以下の情報をSupabaseダッシュボードから取得してください。

### 1. JWT Secret の取得

1. [Supabaseダッシュボード](https://supabase.com/dashboard/project/vdzyixwbikouwkhvvwkn)を開く
2. **Project Settings** → **API** をクリック
3. **JWT Settings** セクションを展開
4. **JWT Secret** をコピー（長いランダム文字列）

### 2. DATABASE_URL の取得

1. [Supabaseダッシュボード](https://supabase.com/dashboard/project/vdzyixwbikouwkhvvwkn)を開く
2. **Project Settings** → **Database** をクリック
3. **Connection String** セクションで **URI** を選択
4. **Connection pooling** は **Session mode** を選択（推奨）
5. 表示された接続文字列をコピー（形式: `postgresql://postgres:[YOUR-PASSWORD]@db.vdzyixwbikouwkhvvwkn.supabase.co:5432/postgres`）
6. `[YOUR-PASSWORD]` を実際のデータベースパスワードに置き換え

---

## Render環境変数の設定

### 設定方法

1. [Renderダッシュボード](https://dashboard.render.com/web/srv-d3fr7qu3jp1c73f4k49g)を開く
2. **Environment** タブをクリック
3. 以下の環境変数を追加または更新:

| 変数名 | 値 |
|:---|:---|
| `DATABASE_URL` | Supabaseから取得した接続文字列 |
| `SUPABASE_URL` | `https://vdzyixwbikouwkhvvwkn.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYwODcsImV4cCI6MjA4Mzg0MjA4N30.Mpgux_8DSAebHK1N6UaayANmGL41q9w2U1kMEW_gcPA` |
| `SUPABASE_JWT_SECRET` | Supabaseから取得したJWT Secret |
| `FRONTEND_URL` | VercelのフロントエンドURL（例: `https://duel-log-app.vercel.app`） |
| `ENVIRONMENT` | `production` |
| `SECRET_KEY` | 既に設定済みの値を維持（OBSトークン用） |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |

4. **Save Changes** をクリック
5. サービスが自動的に再デプロイされます

---

## Vercel環境変数の設定

### 設定方法

1. [Vercelダッシュボード](https://vercel.com/dashboard)を開く
2. プロジェクトを選択
3. **Settings** → **Environment Variables** をクリック
4. 以下の環境変数を追加:

| 変数名 | 値 | 環境 |
|:---|:---|:---|
| `VITE_API_URL` | `https://duel-log-app.onrender.com` | Production, Preview, Development |
| `VITE_SUPABASE_URL` | `https://vdzyixwbikouwkhvvwkn.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYwODcsImV4cCI6MjA4Mzg0MjA4N30.Mpgux_8DSAebHK1N6UaayANmGL41q9w2U1kMEW_gcPA` | Production, Preview, Development |

**注意:**
- Viteの環境変数は必ず `VITE_` プレフィックスが必要です
- すべての環境（Production, Preview, Development）に同じ値を設定してください

5. **Save** をクリック
6. **Deployments** タブで最新のデプロイメントを **Redeploy** する

---

## 自動設定オプション（MCPツール使用）

Claude Codeでは、以下のコマンドで自動的に環境変数を設定できます：

```
必要な情報（JWT Secret、DATABASE_URL）を取得後、Claude Codeが自動的に設定します
```

---

## 設定完了後の確認

### バックエンド（Render）

1. Renderのログを確認:
   ```
   INFO:     Waiting for database to be ready...
   INFO:     Database is ready!
   INFO:     Running migrations...
   INFO:     Migrations complete!
   INFO:     Starting server...
   ```

2. ヘルスチェック:
   ```bash
   curl https://duel-log-app.onrender.com/health
   # 期待レスポンス: {"status":"ok"}
   ```

### フロントエンド（Vercel）

1. デプロイメントURLにアクセス
2. ログインページが表示されることを確認
3. Google OAuthまたはDiscord OAuthでログインを試行
4. 認証後、ダッシュボードが表示されることを確認

---

## トラブルシューティング

### エラー: "Invalid JWT token"

**原因:** `SUPABASE_JWT_SECRET` が正しくない

**解決策:** Supabaseダッシュボードで正しいJWT Secretを確認し、Renderの環境変数を更新

### エラー: データベース接続エラー

**原因:** `DATABASE_URL` が正しくない、またはパスワードが間違っている

**解決策:**
1. Supabaseでデータベースパスワードをリセット
2. 新しいパスワードで接続文字列を更新
3. Renderの`DATABASE_URL`を更新

### フロントエンドが白い画面

**原因:** 環境変数が正しく設定されていない

**解決策:**
1. Vercelの環境変数を確認
2. `VITE_` プレフィックスが付いているか確認
3. Redeployを実行

---

## 次のステップ

環境変数の設定が完了したら：

1. Renderのデプロイメントログを確認
2. Vercelのデプロイメントログを確認
3. フロントエンドにアクセスして動作確認
4. OAuth認証をテスト
5. 対戦履歴の作成・表示をテスト

詳細なデプロイメント手順は `docs/deployment/supabase-deployment-guide.md` を参照してください。
