# CORS エラー修正 - クイックガイド

## 🚨 エラー内容

```
Access to XMLHttpRequest at 'https://duel-log-app.onrender.com/me' 
from origin 'https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app' 
has been blocked by CORS policy
```

## ✅ 解決方法（5分で完了）

### ステップ1: Renderで環境変数を設定

1. **Renderダッシュボードを開く**
   - https://dashboard.render.com にアクセス
   - `duel-log-app` サービスを選択

2. **Environmentをクリック**

3. **以下の環境変数を追加/確認**

   #### 必須の環境変数

   | Key | Value | 説明 |
   |-----|-------|------|
   | `ENVIRONMENT` | `production` | 実行環境（必須） |
   | `FRONTEND_URL` | `https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app` | フロントエンドのURL |
   | `DATABASE_URL` | `postgresql://...` | データベース接続URL |
   | `SECRET_KEY` | `your-secret-key` | JWT署名用秘密鍵 |

   **FRONTENDURLの設定例：**
   
   単一ドメイン：
   ```
   https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
   ```

   複数ドメイン（カンマ区切り）：
   ```
   https://your-production-app.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app,http://localhost:5173
   ```

4. **Save Changes** をクリック

### ステップ2: 再デプロイ

環境変数を保存すると、Renderが自動的に再デプロイを開始します。

または、手動で再デプロイする場合：
- 「Manual Deploy」タブ → 「Deploy latest commit」をクリック

### ステップ3: 動作確認

1. **デプロイ完了まで待つ**（通常2-5分）

2. **Vercelアプリを開く**
   - https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app

3. **ログインを試す**
   - CORSエラーが解消されているはずです

## 📝 コードの変更点

バックエンドコードは既に以下の機能に対応しています：

✅ 複数のフロントエンドURL対応  
✅ Vercelの動的プレビューURL対応（`*.vercel.app`）  
✅ ローカル開発環境対応（`localhost`）  
✅ 開発・本番環境の自動切り替え  

## 🔍 トラブルシューティング

### まだCORSエラーが出る場合

1. **環境変数を確認**
   - Render → Environment タブ
   - `ENVIRONMENT` が `production` に設定されているか確認
   - `FRONTEND_URL` が正しく設定されているか確認

2. **Renderのログを確認**
   - Renderダッシュボード → Logs タブ
   - 「Allowed CORS origins」で検索
   - 設定したURLが表示されているか確認
   - エラーメッセージがないか確認

3. **ブラウザのキャッシュをクリア**
   - F12（開発者ツール）を開く
   - 右クリックで「キャッシュの消去とハード再読み込み」

### AttributeError: 'Settings' object has no attribute 'ENVIRONMENT'

このエラーが出る場合：

1. **Renderで `ENVIRONMENT` 環境変数を追加**
   ```
   Key: ENVIRONMENT
   Value: production
   ```

2. **再デプロイ**
   - 環境変数を保存すると自動的に再デプロイされます

### Vercelのドメインが変わった場合

Vercelのプレビューデプロイは、プロジェクトごとに新しいURLを生成します。

**解決策**: 現在のコードは `*.vercel.app` パターンに一致するすべてのドメインを自動的に許可するため、新しいプレビューURLでも動作します。

## 🎯 本番環境の推奨設定

### Render環境変数（必須）

```env
# アプリケーション設定
ENVIRONMENT=production

# フロントエンドURL
FRONTEND_URL=https://your-production-domain.com

# データベース
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT設定
SECRET_KEY=your-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ログレベル
LOG_LEVEL=INFO
```

### 開発・ステージング・プレビューも含める場合

```env
FRONTEND_URL=https://your-production-domain.com,https://staging.your-domain.com,http://localhost:5173
```

### セキュリティのポイント

- ✅ 本番環境では具体的なドメインのみを許可
- ✅ 環境変数でシークレット情報を管理
- ✅ HTTPSを使用
- ✅ `ENVIRONMENT=production` を設定
- ❌ 本番環境で `allow_origins=["*"]` は使用しない

## 📚 詳細ドキュメント

より詳しい情報は以下を参照：
- [RENDER_CORS_SETUP.md](./RENDER_CORS_SETUP.md) - 完全なCORS設定ガイド
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)

## ✨ 完了！

これでVercelからRenderのバックエンドに正常にアクセスできるようになりました。
