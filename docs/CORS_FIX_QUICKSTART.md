# CORS エラー修正 - 完全ガイド

## 🚨 発生しているエラー

### 1. CORSプリフライトエラー
```
Access to XMLHttpRequest at 'https://duel-log-app.onrender.com/users/' 
from origin 'https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app' 
has been blocked by CORS policy: Request header field content-type 
is not allowed by Access-Control-Allow-Headers in preflight response.
```

### 2. ネットワークエラー
```
Failed to register: AxiosError: Network Error
code: "ERR_NETWORK"
```

## ✅ 解決方法

### ステップ1: コードをGitHubにプッシュ

最新のCORS修正コードをGitHubにプッシュしてください：

```bash
cd C:\Users\grand\work\duel-log-app

git add .
git commit -m "Fix CORS preflight and headers configuration"
git push
```

### ステップ2: Renderで環境変数を設定

1. **Renderダッシュボードを開く**
   - https://dashboard.render.com にアクセス
   - `duel-log-app` サービスを選択

2. **Environmentをクリック**

3. **以下の環境変数を追加/確認**

   #### 必須の環境変数

   | Key | Value | 説明 |
   |-----|-------|------|
   | `ENVIRONMENT` | `production` | **重要**: 実行環境を指定 |
   | `FRONTEND_URL` | `https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app` | フロントエンドのURL |
   | `DATABASE_URL` | `postgresql://...` | データベース接続URL |
   | `SECRET_KEY` | `your-secret-key` | JWT署名用秘密鍵（32文字以上） |
   | `LOG_LEVEL` | `INFO` | ログレベル |

   **FRONTENDURLの設定例：**
   
   単一ドメイン：
   ```
   https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
   ```

   複数ドメイン（カンマ区切り）：
   ```
   https://your-production.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
   ```

4. **Save Changes** をクリック

### ステップ3: 再デプロイの確認

GitHubにプッシュすると、Renderが自動的に再デプロイを開始します。

1. **Deploymentsタブを確認**
2. デプロイが完了するまで待つ（通常2-5分）
3. **Logsタブで確認**
   - 「Environment: production」が表示されるか確認
   - 「Allowed CORS origins」で設定したURLが表示されるか確認

### ステップ4: 動作確認

1. **ブラウザのキャッシュをクリア**
   - F12（開発者ツール）を開く
   - 右クリックで「キャッシュの消去とハード再読み込み」

2. **Vercelアプリを開く**
   - https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app

3. **新規登録を試す**
   - CORSエラーが解消され、登録できるはずです

## 📝 修正内容の詳細

### 1. CORSミドルウェアの改善

- ✅ 標準のCORSMiddlewareを削除（競合防止）
- ✅ カスタムCORSミドルウェアのみを使用
- ✅ プリフライトリクエストの適切な処理
- ✅ 具体的なヘッダーの許可リストを指定
- ✅ ログ出力による問題の可視化

### 2. 許可するヘッダー

```
Content-Type, Authorization, Accept, Origin, User-Agent, X-Requested-With
```

### 3. 動的オリジン対応

- ✅ Vercelのすべてのプレビュードメイン（`*.vercel.app`）
- ✅ ローカルホスト（`localhost:*`、`127.0.0.1:*`）
- ✅ 環境変数で指定した特定のドメイン

## 🔍 トラブルシューティング

### エラー: Still getting CORS errors

#### 1. 環境変数を確認

Render → Environment タブで以下を確認：

```
✅ ENVIRONMENT = production
✅ FRONTEND_URL = https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
✅ DATABASE_URL = postgresql://...
✅ SECRET_KEY = (32文字以上)
```

#### 2. Renderのログを確認

Render → Logs タブで以下を検索：

```
Environment: production
Allowed CORS origins: [...]
```

設定したURLが表示されているか確認してください。

#### 3. デプロイが完了しているか確認

- Render → Deployments タブ
- 最新のデプロイが「Live」になっているか確認

#### 4. ブラウザのキャッシュをクリア

開発者ツール（F12）を開き：
- Application → Clear storage → Clear site data
- または Ctrl+Shift+Delete でキャッシュをクリア

### エラー: AttributeError: 'Settings' object has no attribute 'ENVIRONMENT'

Renderで`ENVIRONMENT`環境変数を設定してください：

```
Key: ENVIRONMENT
Value: production
```

### エラー: Origin not allowed

Renderのログに「Origin not allowed: ...」が表示される場合：

1. **ログに表示されたオリジンをコピー**
2. **FRONTEND_URLに追加**
   ```
   FRONTEND_URL=https://existing.vercel.app,https://new-origin.vercel.app
   ```
3. **Save and Redeploy**

### エラー: 401 Unauthorized on /me endpoint

これは認証の問題です。CORSとは別の問題：

1. **ログインしているか確認**
2. **トークンが保存されているか確認**
   - 開発者ツール → Application → Cookies
   - `access_token`が存在するか確認

## 🎯 ベストプラクティス

### 開発環境

```env
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

開発環境では自動的に`localhost`と`127.0.0.1`が許可されます。

### 本番環境

```env
ENVIRONMENT=production
FRONTEND_URL=https://your-production.vercel.app
```

本番環境では必要最小限のドメインのみを許可してください。

### ステージング環境

```env
ENVIRONMENT=production
FRONTEND_URL=https://production.vercel.app,https://staging.vercel.app
```

## 📊 確認チェックリスト

デプロイ前に以下を確認してください：

- [ ] GitHubに最新のコードがプッシュされている
- [ ] Renderの`ENVIRONMENT`が`production`に設定されている
- [ ] Renderの`FRONTEND_URL`に正しいドメインが設定されている
- [ ] Renderの`SECRET_KEY`が32文字以上に設定されている
- [ ] Renderの`DATABASE_URL`が設定されている
- [ ] Renderで自動デプロイが完了している
- [ ] Renderのログに「Environment: production」が表示されている
- [ ] ブラウザのキャッシュがクリアされている

## ✨ 完了！

すべての手順を完了すると、VercelからRenderのバックエンドに正常にアクセスできるようになります。

## 📚 関連ドキュメント

- [RENDER_CORS_SETUP.md](./RENDER_CORS_SETUP.md) - 詳細なCORS設定ガイド
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [MDN CORS](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
