# Render環境変数設定ガイド - CORS対応

## 問題の原因

VercelからデプロイされたフロントエンドがRender上のバックエンドAPIにアクセスしようとすると、CORSエラーが発生します。これは、バックエンドがVercelのドメインを許可していないためです。

## エラーメッセージ

```
Access to XMLHttpRequest at 'https://duel-log-app.onrender.com/me' from origin 'https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 解決方法

### Renderダッシュボードで環境変数を設定

1. **Renderダッシュボードにアクセス**
   - https://dashboard.render.com にログイン
   - バックエンドのサービス（`duel-log-app`）を選択

2. **Environment設定に移動**
   - 左側のメニューから「Environment」をクリック

3. **環境変数を追加/更新**

#### 方法A: 複数のオリジンを指定（推奨）

以下の環境変数を追加または更新します：

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app` |
| `ALLOW_VERCEL_PREVIEWS` | `true` |

**重要**: 
- `FRONTEND_URL` には本番URLとプレビューURLをカンマ区切りで複数指定できます
- `your-vercel-app.vercel.app` を実際のVercelの本番ドメインに置き換えてください

#### 方法B: ワイルドカード使用（開発時のみ推奨）

**注意**: セキュリティリスクがあるため、本番環境では推奨しません

Pythonコードを以下のように変更する必要があります：

```python
# すべてのオリジンを許可（開発時のみ）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番では使用しないこと
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. サービスを再デプロイ

環境変数を変更した後、サービスを再デプロイします：

1. 「Manual Deploy」タブに移動
2. 「Deploy latest commit」をクリック

または、GitHubにプッシュすると自動的に再デプロイされます。

## 完全な設定例

### Render環境変数

```env
# 本番環境
FRONTEND_URL=https://your-production-app.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app

# または開発も含める場合
FRONTEND_URL=http://localhost:5173,https://your-production-app.vercel.app,https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app

# Vercelプレビューデプロイを許可
ALLOW_VERCEL_PREVIEWS=true

# その他の環境変数
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
ENVIRONMENT=production
```

### Vercelのドメインを確認する方法

1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. 「Deployments」タブで最新のデプロイを確認
4. URLをコピー（例: `https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app`）

**注意**: 
- 本番URL: `https://your-app.vercel.app`
- プレビューURL: `https://your-app-[hash]-[username].vercel.app`

## 動的なVercelプレビューURLへの対応

Vercelはプルリクエストごとに異なるプレビューURLを生成します。これらすべてに対応するには：

### オプション1: 正規表現で対応（推奨）

バックエンドコードを更新して、Vercelのパターンに一致するオリジンを許可します：

```python
import re
from fastapi.middleware.cors import CORSMiddleware

def is_allowed_origin(origin: str) -> bool:
    """オリジンが許可されているか確認"""
    allowed_patterns = [
        r"^https://.*\.vercel\.app$",  # すべてのVercelドメイン
        r"^http://localhost:\d+$",      # ローカルホスト
        r"^https://your-production-domain\.com$",  # 本番ドメイン
    ]
    
    for pattern in allowed_patterns:
        if re.match(pattern, origin):
            return True
    return False

# カスタムCORSミドルウェア
@app.middleware("http")
async def cors_middleware(request, call_next):
    origin = request.headers.get("origin")
    
    response = await call_next(request)
    
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response
```

### オプション2: 環境変数で許可パターンを指定

```env
ALLOWED_ORIGIN_PATTERNS=https://.*\.vercel\.app,http://localhost:\d+
```

## トラブルシューティング

### エラー: Still getting CORS errors

1. **Renderのログを確認**
   ```
   Logs タブで「Allowed CORS origins」を検索
   ```

2. **環境変数が反映されているか確認**
   - Environment タブで設定した値が正しいか確認
   - 再デプロイ後にログを確認

3. **ブラウザのキャッシュをクリア**
   - 開発者ツールを開く（F12）
   - Application タブ → Clear storage → Clear site data

### エラー: Credentials included but not allowed

`allow_credentials=True` を設定している場合、`allow_origins` に `"*"` は使用できません。具体的なオリジンを指定する必要があります。

### エラー: OPTIONS request failing

プリフライトリクエストが失敗している場合：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,  # プリフライトキャッシュ
)
```

## セキュリティのベストプラクティス

### ✅ すべきこと

1. **具体的なドメインを指定**
   ```python
   allow_origins=[
       "https://your-app.vercel.app",
       "https://preview-*.vercel.app",
   ]
   ```

2. **必要なメソッドのみ許可**
   ```python
   allow_methods=["GET", "POST", "PUT", "DELETE"]
   ```

3. **環境ごとに異なる設定**
   - 開発: すべてのlocalhostを許可
   - 本番: 本番ドメインのみ許可

### ❌ すべきでないこと

1. **本番環境で `allow_origins=["*"]` を使用**
   - セキュリティリスクが高い
   - `allow_credentials=True` と併用不可

2. **プレーンテキストでシークレットをコミット**
   - 環境変数を使用する

## 参考リンク

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Domains](https://vercel.com/docs/concepts/projects/domains)
