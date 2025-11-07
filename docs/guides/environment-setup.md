# 環境変数設定ガイド

## 概要

このプロジェクトでは、環境ごとに異なる設定を環境変数ファイルで管理しています。
環境変数ファイルは`.gitignore`に追加されており、リポジトリには含まれません。

## バックエンド環境変数

### 設定ファイル: `backend/.env`

1. サンプルファイルをコピー:
```bash
cd backend
cp .env.example .env
```

2. `.env`ファイルを編集:
```bash
# データベース接続URL
DATABASE_URL=postgresql://user:password@localhost:5432/duel_log_db

# JWT署名用のシークレットキー（本番環境では必ず変更）
SECRET_KEY=your_secret_key_here

# 環境設定（development, production, test）
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

1. サンプルファイルをコピー:
```bash
cd frontend
cp .env.example .env.development
```

2. `.env.development`ファイルを編集:
```bash
# 開発環境用の環境変数
VITE_API_URL=http://localhost:8000
```

### 本番環境: `frontend/.env.production`

1. ファイル作成:
```bash
cd frontend
cp .env.example .env.production
```

2. `.env.production`ファイルを編集:
```bash
# 本番環境用の環境変数
# 本番環境のAPIのURLに置き換えてください
VITE_API_URL=https://your-production-api.com
```

### テスト環境: `frontend/.env.test`

1. ファイル作成:
```bash
cd frontend
cp .env.example .env.test
```

2. `.env.test`ファイルを編集:
```bash
# テスト環境用の環境変数
VITE_API_URL=http://localhost:8000
```

## Docker環境での設定

Docker Composeを使用する場合、環境変数は`docker-compose.yml`内で定義されています。

開発環境では、ルートディレクトリの`.env`ファイルも参照します:

```bash
# ルートディレクトリで
cp .env.example .env
```

## 環境変数ファイルの優先順位

Viteは以下の優先順位で環境変数を読み込みます:

1. `.env.[mode].local` (最優先、gitignoreされる)
2. `.env.[mode]` (環境固有、gitignoreされる)
3. `.env.local` (全環境、gitignoreされる)
4. `.env` (全環境、gitignoreされる)

## セキュリティに関する注意事項

### ⚠️ 重要な注意点

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

### 環境変数が読み込まれない

1. **ファイル名を確認**
   - Viteは`.env.[mode]`形式のファイル名を期待
   - `npm run dev` → `.env.development`を読み込む
   - `npm run build` → `.env.production`を読み込む

2. **サーバーを再起動**
   - 環境変数ファイルを変更した後は、開発サーバーを再起動

3. **プレフィックスを確認**
   - Viteで環境変数を使用する場合、`VITE_`プレフィックスが必須
   - 例: `VITE_API_URL` ✅ / `API_URL` ❌

### データベース接続エラー

1. **DATABASE_URLの形式を確認**
   ```
   postgresql://[user]:[password]@[host]:[port]/[database_name]
   ```

2. **PostgreSQLが起動しているか確認**
   ```bash
   # Docker Composeの場合
   docker-compose ps

   # ローカルPostgreSQLの場合
   sudo systemctl status postgresql  # Linux
   brew services list  # macOS
   ```

## 参考リソース

- [Vite環境変数ドキュメント](https://vitejs.dev/guide/env-and-mode.html)
- [FastAPI設定ドキュメント](https://fastapi.tiangolo.com/advanced/settings/)
- [Twelve-Factor App: Config](https://12factor.net/config)

## チェックリスト

新規メンバーのセットアップ時:

- [ ] `backend/.env`を`.env.example`からコピーして作成
- [ ] `backend/.env`内のSECRET_KEYを生成して設定
- [ ] `frontend/.env.development`を`.env.example`からコピーして作成
- [ ] `frontend/.env.development`内のVITE_API_URLを確認
- [ ] PostgreSQLが起動していることを確認
- [ ] バックエンド開発サーバーを起動して接続確認
- [ ] フロントエンド開発サーバーを起動して動作確認
