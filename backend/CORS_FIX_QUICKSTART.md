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

3. **環境変数を追加**

   新しい環境変数を追加：
   
   ```
   Key: FRONTEND_URL
   Value: https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
   ```

   **または複数のドメインを指定する場合：**
   
   ```
   Key: FRONTEND_URL
   Value: https://your-production-app.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app,http://localhost:5173
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

1. **ブラウザのキャッシュをクリア**
   - F12（開発者ツール）を開く
   - 右クリックで「キャッシュの消去とハード再読み込み」

2. **Renderのログを確認**
   - Renderダッシュボード → Logs タブ
   - 「Allowed CORS origins」で検索
   - 設定したURLが表示されているか確認

3. **環境変数を確認**
   - Render → Environment タブ
   - `FRONTEND_URL` が正しく設定されているか確認

### Vercelのドメインが変わった場合

Vercelのプレビューデプロイは、プロジェクトごとに新しいURLを生成します。

**解決策**: 現在のコードは `*.vercel.app` パターンに一致するすべてのドメインを自動的に許可するため、新しいプレビューURLでも動作します。

## 🎯 本番環境の推奨設定

### Render環境変数

```env
# 本番環境
FRONTEND_URL=https://your-production-domain.com

# 開発・ステージング・プレビューも含める場合
FRONTEND_URL=https://your-production-domain.com,http://localhost:5173

# データベース
DATABASE_URL=postgresql://...

# その他
SECRET_KEY=your-secret-key
ENVIRONMENT=production
```

### セキュリティのポイント

- ✅ 本番環境では具体的なドメインのみを許可
- ✅ 環境変数でシークレット情報を管理
- ✅ HTTPSを使用
- ❌ 本番環境で `allow_origins=["*"]` は使用しない

## 📚 詳細ドキュメント

より詳しい情報は以下を参照：
- [RENDER_CORS_SETUP.md](./RENDER_CORS_SETUP.md) - 完全なCORS設定ガイド
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)

## ✨ 完了！

これでVercelからRenderのバックエンドに正常にアクセスできるようになりました。
