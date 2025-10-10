# Duel Log App

## 概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・管理し、詳細な統計情報を分析するためのWebアプリケーションです。自分のデッキと相手のデッキの相性、勝率、ゲームモードごとのパフォーマンスなどを視覚的に把握できます。

## 機能

- **対戦履歴の記録**: 使用デッキ、相手デッキ、勝敗、先攻/後攻、コイントス結果、ゲームモード（ランク、レート、イベント、DC）、ランク/レート/DC値、対戦日時、メモなどを詳細に記録。
- **デッキ管理**: 自分のデッキと相手のデッキを登録・管理。
- **統計情報の可視化**:
    - 月間・直近の相手デッキ分布
    - デッキ相性表
    - 時系列でのレート/DC値の推移
- **CSVインポート/エクスポート**: 対戦履歴のCSV形式での一括インポートおよびエクスポート。
- **配信者モード**: ライブ配信時にメールアドレスなどの個人情報を自動的にマスクする機能。
- **統計情報の共有**: 特定の期間の統計情報を共有可能なURLを生成。

## 技術スタック

### バックエンド

- **言語**: Python
- **フレームワーク**: FastAPI
- **データベース**: PostgreSQL (Neon)
- **ORM**: SQLAlchemy
- **マイグレーション**: Alembic
- **認証**: JWT (HttpOnly Cookie)

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: Vue.js 3 (Composition API)
- **UIフレームワーク**: Vuetify 3
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **HTTP通信**: Axios
- **ビルドツール**: Vite
- **チャート**: ApexCharts

## 開発環境のセットアップ

### 前提条件

- Docker および Docker Compose
- Node.js (v18以上) および npm
- Python (v3.9以上) および pip

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/duel-log-app.git
cd duel-log-app
```

### 2. 環境変数の設定

`.env.example` を参考に、`.env` ファイルをプロジェクトルートに作成し、必要な環境変数を設定してください。

```
# .env (例)
DATABASE_URL="postgresql://user:password@db:5432/duel_log_db"
SECRET_KEY="your_secret_key_for_jwt"
ENVIRONMENT="development"
FRONTEND_URL="http://localhost:5173" # フロントエンドのURL
```

### 3. Docker Compose でサービスを起動

```bash
docker-compose up --build
```

これにより、PostgreSQLデータベース、バックエンドAPI、およびフロントエンド開発サーバーが起動します。

### 4. データベースの初期化とマイグレーション

バックエンドサービスが起動したら、データベースの初期化とマイグレーションを実行します。

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -c "from app.db.seed import seed_db; seed_db()" # 必要であればシードデータ投入
```

### 5. フロントエンドの依存関係のインストール

```bash
cd frontend
npm install
cd ..
```

### 6. アプリケーションの実行

`docker-compose up` で既に起動していますが、フロントエンド開発サーバーは `http://localhost:5173` でアクセス可能です。

## 開発ガイドライン

詳細な開発ガイドラインについては、[開発ガイドライン](docs/development-guide.md) を参照してください。

- コーディング規約 (Black, Ruff, Prettier, ESLint)
- ブランチ戦略 (GitHub Flow)
- コミットメッセージ (Conventional Commits)
- テスト

## デプロイ

本アプリケーションのデプロイ手順については、[デプロイ手順書](docs/deployment.md) を参照してください。

- フロントエンド: Vercel
- バックエンド: Render
- データベース: Neon (PostgreSQL)
- CI/CD: GitHub Actions

## APIリファレンス

バックエンドAPIの詳細については、[APIリファレンス](docs/api-reference.md) を参照してください。

## データベーススキーマ

データベースのテーブル構造については、[データベーススキーマ](docs/db-schema.md) を参照してください。

## エラーハンドリング

エラーハンドリングの設計方針については、[エラーハンドリング設計](docs/error-handling.md) を参照してください。

## フロントエンドアーキテクチャ

フロントエンドのアーキテクチャについては、[フロントエンドアーキテクチャ](docs/frontend-architecture.md) を参照してください。

## 配信者モード

配信者モードの詳細については、[配信者モード](docs/streamer-mode.md) を参照してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細については [LICENSE](LICENSE) ファイルを参照してください。