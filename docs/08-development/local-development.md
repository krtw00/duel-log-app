# ローカル開発環境ガイド

## 概要

このプロジェクトでは、**ローカルSupabase**を使用したネイティブ開発環境を採用しています。
Dockerコンテナでアプリケーションを実行するのではなく、ローカルのPython/Node.js環境で直接開発を行います。

### この方式のメリット

- **高速なホットリロード**: ファイル変更が即座に反映
- **デバッグが容易**: IDE/エディタとの連携が簡単
- **リソース効率**: 必要最小限のコンテナ（Supabaseのみ）
- **本番環境との一貫性**: Render/Vercelのデプロイ方式と同一

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    ローカル開発環境                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Frontend   │    │  Backend    │    │  Supabase   │  │
│  │  (Vite)     │───▶│  (uvicorn)  │───▶│  (Docker)   │  │
│  │  :5173      │    │  :8000      │    │  :55321-    │  │
│  └─────────────┘    └─────────────┘    │  55324      │  │
│        ▲                  ▲            └─────────────┘  │
│        │                  │                   │         │
│  ┌─────┴─────┐      ┌─────┴─────┐      ┌─────┴─────┐   │
│  │  Node.js  │      │  Python   │      │  Docker   │   │
│  │  18+      │      │  3.11+    │      │  Desktop  │   │
│  └───────────┘      └───────────┘      └───────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## クイックスタート

### 1. 前提条件の確認

```bash
# Node.js
node --version  # 18以上

# Python
python3 --version  # 3.11以上

# Supabase CLI
supabase --version  # 2.0以上

# Docker
docker --version
```

### 2. 開発環境の起動

```bash
# プロジェクトルートで実行
./scripts/dev.sh
```

これで以下のサービスが起動します：

| サービス | URL | 説明 |
|---------|-----|------|
| Frontend | http://localhost:5173 | Vueアプリケーション |
| Backend | http://127.0.0.1:8000 | FastAPI |
| API Docs | http://127.0.0.1:8000/docs | Swagger UI |
| Supabase Studio | http://127.0.0.1:55323 | DB管理UI |
| Mailpit | http://127.0.0.1:55324 | メールテスト |

### 3. 停止

```bash
# Ctrl+C で Frontend/Backend を停止

# Supabaseも停止する場合
./scripts/dev-stop.sh
```

## 開発スクリプト

### `scripts/dev.sh`
全サービスを一括起動。初回実行時は自動的に：
- Python仮想環境を作成
- 依存関係をインストール
- データベースマイグレーションを実行

### `scripts/dev-backend.sh`
バックエンドのみ起動。フロントエンドは別ターミナルで実行可能。

### `scripts/dev-frontend.sh`
フロントエンドのみ起動。

### `scripts/dev-supabase.sh`
ローカルSupabaseのみ起動。

### `scripts/dev-stop.sh`
全サービス（Supabase含む）を停止。

### `scripts/dev-migrate.sh`
データベースマイグレーションを実行。

## 個別のサービス起動

### バックエンドのみ

```bash
cd backend

# 環境変数を設定
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55322/postgres"
export SECRET_KEY="your-secret-key"
export ENVIRONMENT="development"
export FRONTEND_URL="http://localhost:5173"

uv run python start.py
```

### フロントエンドのみ

```bash
cd frontend
npm run dev
```

## データベース操作

### Supabase Studio
http://127.0.0.1:55323 でGUIからテーブルを操作可能。

### psqlで接続

```bash
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres
```

### マイグレーション

```bash
cd backend
uv run alembic upgrade head      # マイグレーション適用
uv run alembic downgrade -1      # ロールバック
uv run alembic revision --autogenerate -m "説明"  # 新規作成
```

## テスト実行

### バックエンド

```bash
cd backend
uv run pytest                           # 全テスト
uv run pytest --cov=app                 # カバレッジ付き
uv run pytest tests/test_auth.py -v     # 特定ファイル
```

### フロントエンド

```bash
cd frontend
npm run test              # ウォッチモード
npm run test:unit         # 1回実行
npm run test:coverage     # カバレッジ付き
```

## 本番環境との違い

| 項目 | ローカル | 本番 |
|------|---------|------|
| フロントエンド | Vite dev server | Vercel (静的ホスティング) |
| バックエンド | uvicorn (reload) | Render (uvicorn) |
| データベース | ローカルSupabase | Neon PostgreSQL |
| 認証 | ローカルSupabase Auth | Supabase Auth |

**重要**: 本番環境（Render/Vercel）へのデプロイはDockerを使用しません。
直接Python/Node.jsで実行されるため、ローカル開発環境と同じ方式です。

## トラブルシューティング

### Supabaseが起動しない

```bash
# Dockerが起動しているか確認
docker ps

# Supabaseを再起動
supabase stop
supabase start
```

### ポートが使用中

```bash
# 使用中のプロセスを確認
lsof -i :8000   # Backend
lsof -i :5173   # Frontend
lsof -i :55322  # Supabase DB

# 強制停止
kill -9 <PID>
```

### Python依存関係エラー

```bash
cd backend
rm -rf .venv
uv sync
```

### フロントエンド依存関係エラー

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 環境変数が反映されない

開発スクリプトを使用している場合、環境変数はスクリプト内で自動設定されます。
手動設定する場合は、`.env`ファイルを作成するか、exportコマンドで設定してください。

## 参考情報

- [環境変数設定ガイド](./environment-setup.md)
- [開発ガイド](./development-guide.md)
- [Supabase CLIドキュメント](https://supabase.com/docs/guides/cli)
