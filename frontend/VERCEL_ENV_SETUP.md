# Vercel環境変数設定ガイド

## Vercelダッシュボードでの設定手順

### 1. プロジェクトの設定画面を開く

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. デプロイしたプロジェクトを選択
3. 上部の **Settings** タブをクリック
4. 左側のメニューから **Environment Variables** を選択

### 2. 環境変数を追加

#### 必須の環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `VITE_API_URL` | バックエンドAPIのベースURL | `https://api.your-domain.com` |

#### 追加手順

1. **Add New** ボタンをクリック
2. 以下を入力：
   - **Name**: `VITE_API_URL`
   - **Value**: 本番APIのURL（例: `https://api.your-domain.com`）
   - **Environment**: 環境を選択
     - ✅ **Production** - 本番環境（必須）
     - ✅ **Preview** - プレビュー環境（プルリクエストごとのデプロイ）
     - ⬜ **Development** - ローカル開発環境（通常は不要）

3. **Save** をクリック

### 3. 再デプロイ

環境変数を追加または変更した後は、変更を反映するために再デプロイが必要です。

#### 方法A: 自動再デプロイ（推奨）
- GitHubにプッシュすると自動的に再デプロイされます

#### 方法B: 手動再デプロイ
1. プロジェクトの **Deployments** タブに移動
2. 最新のデプロイメントの右側にある「...」メニューをクリック
3. **Redeploy** を選択

## Vercel CLIでの設定（代替方法）

### 前提条件

```bash
# Vercel CLIのインストール
npm i -g vercel

# ログイン
vercel login
```

### 環境変数の追加

```bash
# プロジェクトディレクトリに移動
cd frontend

# 本番環境用の環境変数を追加
vercel env add VITE_API_URL production

# プロンプトが表示されたら、APIのURLを入力
# 例: https://api.your-domain.com

# プレビュー環境用にも追加（オプション）
vercel env add VITE_API_URL preview
```

### 環境変数の確認

```bash
# 設定されている環境変数を確認
vercel env ls
```

### 環境変数の削除

```bash
# 環境変数を削除
vercel env rm VITE_API_URL production
```

## 環境変数の確認方法

### ビルドログで確認

1. Vercel Dashboardの **Deployments** タブを開く
2. デプロイメントをクリック
3. **Building** セクションを展開
4. ログ内で環境変数が読み込まれていることを確認

### ブラウザコンソールで確認

**注意**: 本番環境では絶対に使用しないでください。開発時のデバッグのみ。

```javascript
// ブラウザのコンソールで実行（開発時のみ）
console.log('API URL:', import.meta.env.VITE_API_URL)
```

## トラブルシューティング

### 環境変数が反映されない

#### 原因1: デプロイ時に環境変数が存在しなかった
- **解決策**: 環境変数追加後に再デプロイする

#### 原因2: 環境変数名が間違っている
- **解決策**: Viteで使用する環境変数は必ず `VITE_` で始まる必要があります
- ❌ `API_URL`
- ✅ `VITE_API_URL`

#### 原因3: ブラウザキャッシュ
- **解決策**: ブラウザのキャッシュをクリアしてページを再読み込み

### CORS エラーが発生する

バックエンドAPIでVercelのドメインを許可する必要があります。

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-app.vercel.app",  # Vercelのドメインを追加
        "https://*.vercel.app",  # プレビューデプロイ用（ワイルドカード）
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## セキュリティのベストプラクティス

### ✅ すべきこと

1. **環境変数にAPIキーなどの機密情報を保存**
   - Vercel Dashboardに保存すれば安全に管理できます

2. **本番環境とプレビュー環境で異なる値を使用**
   - 本番: 本番API
   - プレビュー: ステージングAPI

3. **環境変数の命名規則を守る**
   - Viteで使用する場合は `VITE_` プレフィックスが必須

### ❌ すべきでないこと

1. **機密情報を `.env` ファイルにコミットしない**
   - `.gitignore` で除外されていることを確認

2. **フロントエンドの環境変数に秘密鍵を保存しない**
   - フロントエンドの環境変数はビルド時にコードに埋め込まれ、ブラウザから見えます
   - APIキーなどはバックエンドで管理してください

## 複数環境の管理例

### パターン1: 環境ごとに異なるAPI

```
Production:  VITE_API_URL = https://api.production.com
Preview:     VITE_API_URL = https://api.staging.com
Development: VITE_API_URL = http://localhost:8000
```

### パターン2: 同じAPIで認証が異なる

```
Production:  
  VITE_API_URL = https://api.example.com
  VITE_ENV = production

Preview:     
  VITE_API_URL = https://api.example.com
  VITE_ENV = staging
```

## 参考リンク

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
