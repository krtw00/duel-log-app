# Supabase移行後のデプロイ手順書

このドキュメントは、Supabase Auth統合後のDuel Log Appのデプロイ手順について記述します。

---

## 概要

本アプリケーションは、以下の構成でホスティングされています。

- **フロントエンド**: Vercel
- **バックエンド**: Render
- **データベース**: Supabase PostgreSQL
- **認証**: Supabase Auth (Google OAuth, Discord OAuth対応)

---

## 1. Supabaseプロジェクトのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com/)にログインします
2. "New Project"をクリックして新しいプロジェクトを作成します
3. プロジェクト名、データベースパスワード、リージョンを設定します
   - **推奨リージョン**: Tokyo (asia-northeast1) または最も近いリージョン

### 1.2 認証設定情報の取得

プロジェクト作成後、以下の情報を取得します。

1. **Project Settings** → **API** から以下を取得:
   - `Project URL`: `https://xxxxxxxxxxxxx.supabase.co`
   - `anon public` key: `eyJhbGc...` (公開可能なキー)

2. **Project Settings** → **API** → **JWT Settings** から:
   - `JWT Secret`: JWTトークン検証用のシークレット

これらの値は後でVercelとRenderの環境変数に設定します。

### 1.3 OAuth プロバイダーの設定

Google OAuthとDiscord OAuthを有効化します。

#### Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs** を作成
3. **Authorized redirect URIs** に以下を追加:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
4. Client IDとClient Secretを取得
5. Supabaseダッシュボードの**Authentication** → **Providers** → **Google** で:
   - Google OAuth を有効化
   - Client IDとClient Secretを設定

#### Discord OAuth設定

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリケーションを作成
2. **OAuth2** → **Redirects** に以下を追加:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
3. Client IDとClient Secretを取得
4. Supabaseダッシュボードの**Authentication** → **Providers** → **Discord** で:
   - Discord OAuth を有効化
   - Client IDとClient Secretを設定

### 1.4 リダイレクトURL設定

**Authentication** → **URL Configuration** で以下を設定:

- **Site URL**: `https://your-frontend-app.vercel.app`
- **Redirect URLs**: 以下を追加
  ```
  https://your-frontend-app.vercel.app/auth/callback
  http://localhost:5173/auth/callback  # 開発環境用
  ```

### 1.5 データベーススキーマのセットアップ

Supabaseのデータベースに、既存のアプリケーション用テーブルを作成します。

1. **SQL Editor** を開く
2. バックエンドのAlembicマイグレーションをSupabaseデータベースに適用します（後述）

---

## 2. フロントエンド (Vercel) のデプロイ

### 2.1 環境変数の設定

Vercelプロジェクトの **Settings** → **Environment Variables** で以下を設定:

| 変数名 | 値 | 環境 | 説明 |
|:---|:---|:---|:---|
| `VITE_API_URL` | `https://your-backend-app.onrender.com` | Production, Preview, Development | バックエンドAPIのURL |
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` | Production, Preview, Development | SupabaseプロジェクトURL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development | Supabase公開キー（anon key） |

**重要な注意事項:**
- Viteの環境変数は必ず `VITE_` プレフィックスが必要です
- すべての環境（Production, Preview, Development）に同じ値を設定してください
- `VITE_SUPABASE_ANON_KEY` は公開可能なキーです（フロントエンドに埋め込まれます）

### 2.2 デプロイ設定

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci` (推奨) または `npm install`

### 2.3 デプロイの実行

環境変数を設定後、"Redeploy"をクリックして再デプロイします。
以降、`main`ブランチへのプッシュで自動デプロイされます。

---

## 3. バックエンド (Render) のデプロイ

### 3.1 環境変数の設定

Renderプロジェクトの **Environment** で以下を設定:

| 変数名 | 値 | 説明 |
|:---|:---|:---|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres` | Supabaseデータベース接続URL |
| `SECRET_KEY` | `openssl rand -base64 32`で生成 | OBSトークン用JWT秘密鍵 |
| `SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` | SupabaseプロジェクトURL |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase公開キー |
| `SUPABASE_JWT_SECRET` | JWT Secret (Supabaseダッシュボードから取得) | Supabase JWTトークン検証用 |
| `ENVIRONMENT` | `production` | 環境識別子 |
| `FRONTEND_URL` | `https://your-frontend-app.vercel.app` | CORS設定用 |
| `ALGORITHM` | `HS256` | JWT署名アルゴリズム |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | OBSトークンの有効期限（分） |

**DATABASE_URLの取得方法:**
1. Supabaseダッシュボードの **Project Settings** → **Database** を開く
2. **Connection String** → **URI** の値をコピー
3. `[YOUR-PASSWORD]` を実際のデータベースパスワードに置き換える

**SECRET_KEYの生成:**
```bash
openssl rand -base64 32
```

**注意:** `SECRET_KEY`は既存のOBSトークン機能用です。Supabase Authとは別のJWT署名に使用されます。

### 3.2 データベースマイグレーション

バックエンドがデプロイされると、`start.py`が自動的に以下を実行します：

1. データベース接続の待機
2. Alembicマイグレーションの実行 (`alembic upgrade head`)
3. Uvicornサーバーの起動

初回デプロイ時に、既存のマイグレーションがすべて適用されます。

**手動でマイグレーションを実行する場合:**
```bash
# Renderのシェルまたはローカル環境で
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
alembic upgrade head
```

### 3.3 ユーザーデータのマイグレーション

既存のNeonデータベースからSupabaseへデータ移行が完了している場合、`users`テーブルに`supabase_uuid`カラムが追加されています。

**新規ユーザーの場合:**
- Supabase Authで認証後、自動的に`supabase_uuid`が設定されます

**既存ユーザーの場合:**
- Supabase Authでアカウントを再作成し、`supabase_uuid`を紐付ける必要があります
- または、管理スクリプトで一括マッピングを実行します（別途実装が必要）

---

## 4. 環境変数の一覧表

### フロントエンド (Vercel)

```bash
# .env または Vercel Environment Variables
VITE_API_URL=https://your-backend-app.onrender.com
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### バックエンド (Render)

```bash
# Render Environment Variables
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
SECRET_KEY=<openssl rand -base64 32で生成>
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=<SupabaseダッシュボードのJWT Secret>
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-app.vercel.app
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 5. デプロイ後の確認

### 5.1 フロントエンド

1. Vercelのデプロイメント URL にアクセス
2. ログインページが表示されることを確認
3. Google OAuthまたはDiscord OAuthでログインを試行
4. 認証後、ダッシュボードが表示されることを確認

### 5.2 バックエンド

1. Renderのログを確認:
   ```
   INFO:     Waiting for database to be ready...
   INFO:     Database is ready!
   INFO:     Running migrations...
   INFO:     Migrations complete!
   INFO:     Starting server...
   ```

2. APIヘルスチェック:
   ```bash
   curl https://your-backend-app.onrender.com/health
   # 期待レスポンス: {"status":"ok"}
   ```

3. 認証テスト:
   - フロントエンドからログインして、バックエンドAPIにリクエストが成功することを確認
   - Supabase JWTトークンが正しく検証されることを確認

### 5.3 OAuth認証フロー

1. フロントエンドでGoogle/Discordログインボタンをクリック
2. OAuthプロバイダーの認証画面にリダイレクト
3. 認証後、`/auth/callback`にリダイレクト
4. Supabaseセッションが確立され、ダッシュボードにリダイレクト

---

## 6. トラブルシューティング

### エラー: "Missing Supabase environment variables"

**原因:** Vercelの環境変数が正しく設定されていない

**解決策:**
1. Vercel Settings → Environment Variables を確認
2. `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が設定されているか確認
3. 設定後、Redeployを実行

### エラー: "Invalid JWT token"

**原因:** バックエンドの`SUPABASE_JWT_SECRET`が正しくない

**解決策:**
1. Supabaseダッシュボード → Project Settings → API → JWT Settings で正しいシークレットを確認
2. Renderの環境変数`SUPABASE_JWT_SECRET`を更新
3. Renderサービスを再起動

### OAuth認証が失敗する

**原因:** リダイレクトURLが正しく設定されていない

**解決策:**
1. Supabaseダッシュボード → Authentication → URL Configuration を確認
2. Google/Discord Developer Consoleでリダイレクト URIを確認
3. すべて `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback` が設定されているか確認

### データベースマイグレーションが失敗

**原因:** `DATABASE_URL` が正しくない、またはネットワークエラー

**解決策:**
1. Renderログで詳細なエラーメッセージを確認
2. `DATABASE_URL` の形式を確認（パスワードに特殊文字がある場合はURLエンコード）
3. Supabaseのデータベースが稼働しているか確認

---

## 7. 参考情報

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Vercelデプロイメントガイド](https://vercel.com/docs)
- [Renderデプロイメントガイド](https://render.com/docs)
- [Alembicマイグレーションガイド](https://alembic.sqlalchemy.org/)
