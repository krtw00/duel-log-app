# 環境変数設定ガイド

## 概要

このプロジェクトでは、環境ごとに異なる設定を環境変数ファイルで管理しています。
環境変数ファイルは`.gitignore`に追加されており、リポジトリには含まれません。

## ローカル開発環境のセットアップ

### 推奨: ローカルSupabase環境

開発環境では**ローカルSupabase**を使用します。これにより：
- 本番環境に影響を与えずに開発可能
- 高速なデータベースアクセス
- オフラインでの開発が可能

#### 前提条件

- **Supabase CLI**: `supabase --version` で確認
- **Docker**: ローカルSupabaseの実行に必要
- **Node.js 18+**: フロントエンド開発用
- **Python 3.11+**: バックエンド開発用

#### クイックスタート

```bash
# プロジェクトルートで実行
./scripts/dev.sh
```

このスクリプトは以下を自動的に実行します：
1. ローカルSupabaseの起動
2. Python仮想環境の作成と依存関係のインストール
3. データベースマイグレーションの実行
4. バックエンド・フロントエンドの起動

#### 手動セットアップ

```bash
# 1. ローカルSupabaseを起動
cd /path/to/duel-log-app
supabase start

# 2. バックエンドを起動
./scripts/dev-backend.sh

# 3. フロントエンドを起動（別ターミナル）
./scripts/dev-frontend.sh
```

#### 停止方法

```bash
# 全サービスを停止（Supabaseは継続）
Ctrl+C

# Supabaseも停止
./scripts/dev-stop.sh
```

## バックエンド環境変数

### 設定ファイル: `backend/.env`

開発スクリプト（`scripts/dev.sh`）を使用する場合、環境変数は自動的に設定されます。

手動で設定する場合：

```bash
cd backend
cp .env.example .env
```

`.env`ファイルの内容：

```bash
# データベース接続URL（ローカルSupabase）
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55322/postgres

# Supabase設定
SUPABASE_URL=http://127.0.0.1:55321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# JWT署名用のシークレットキー
SECRET_KEY=your_secret_key_here

# 環境設定
ENVIRONMENT=development

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5173
```

### SECRET_KEY生成方法

```bash
# OpenSSLで安全なシークレットキーを生成
openssl rand -hex 32
```

## フロントエンド環境変数

### 開発環境: `frontend/.env.development`

ローカルSupabase用の設定：

```bash
VITE_API_URL=http://localhost:8000

# Supabase Configuration (Local)
VITE_SUPABASE_URL=http://127.0.0.1:55321
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

### 本番環境: `frontend/.env.production`

```bash
VITE_API_URL=https://duel-log-app.onrender.com

# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### テスト環境: `frontend/.env.test`

```bash
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=http://127.0.0.1:55321
VITE_SUPABASE_ANON_KEY=test_key
```

## 環境変数ファイルの優先順位

Viteは以下の優先順位で環境変数を読み込みます：

1. `.env.[mode].local` (最優先、gitignoreされる)
2. `.env.[mode]` (環境固有、gitignoreされる)
3. `.env.local` (全環境、gitignoreされる)
4. `.env` (全環境、gitignoreされる)

## 開発用URL一覧

ローカルSupabase起動時に使用できるURL：

| サービス | URL | 説明 |
|---------|-----|------|
| Frontend | http://localhost:5173 | Vueアプリケーション |
| Backend API | http://127.0.0.1:8000 | FastAPI |
| API Docs | http://127.0.0.1:8000/docs | Swagger UI |
| Supabase Studio | http://127.0.0.1:55323 | DB管理UI |
| Mailpit | http://127.0.0.1:55324 | メールテスト |

## セキュリティに関する注意事項

### 重要な注意点

1. **機密情報を含むファイルはコミットしない**
   - `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`は絶対にGitにコミットしない
   - これらのファイルは`.gitignore`に追加済み

2. **SECRET_KEYは定期的に変更**
   - 本番環境のSECRET_KEYは定期的にローテーション
   - 開発環境と本番環境で異なるキーを使用

3. **データベース認証情報の管理**
   - 本番環境のデータベース認証情報は環境変数で管理
   - CI/CDツール（GitHub Actions、Render等）のシークレット機能を使用

4. **APIキーやトークンの保護**
   - 外部サービスのAPIキーは環境変数で管理
   - フロントエンドで使用する環境変数には`VITE_`プレフィックスが必要
   - 機密情報は`VITE_`プレフィックスを付けない（ビルドに含まれない）

## トラブルシューティング

### ローカルSupabaseが起動しない

```bash
# Dockerが起動しているか確認
docker ps

# Supabaseの状態を確認
supabase status

# 再起動
supabase stop
supabase start
```

### ポートが使用中

```bash
# 使用中のポートを確認
lsof -i :8000
lsof -i :5173
lsof -i :55322

# プロセスを停止
kill -9 <PID>
```

### 環境変数が読み込まれない

1. **ファイル名を確認**
   - Viteは`.env.[mode]`形式のファイル名を期待
   - `npm run dev` → `.env.development`を読み込む
   - `npm run build` → `.env.production`を読み込む

2. **サーバーを再起動**
   - 環境変数ファイルを変更した後は、開発サーバーを再起動

3. **プレフィックスを確認**
   - Viteで環境変数を使用する場合、`VITE_`プレフィックスが必須
   - 例: `VITE_API_URL` / `API_URL`

### データベース接続エラー

```bash
# Supabaseが起動しているか確認
supabase status

# 接続テスト
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres
```

## 参考リソース

- [Vite環境変数ドキュメント](https://vitejs.dev/guide/env-and-mode.html)
- [FastAPI設定ドキュメント](https://fastapi.tiangolo.com/advanced/settings/)
- [Supabase CLIドキュメント](https://supabase.com/docs/guides/cli)
- [Twelve-Factor App: Config](https://12factor.net/config)

## チェックリスト

新規メンバーのセットアップ時:

- [ ] Supabase CLIがインストールされていることを確認
- [ ] Dockerが起動していることを確認
- [ ] `./scripts/dev.sh`を実行
- [ ] http://localhost:5173 でフロントエンドにアクセス
- [ ] http://127.0.0.1:8000/docs でAPI Docsにアクセス
- [ ] http://127.0.0.1:55323 でSupabase Studioにアクセス
