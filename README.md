# Duel Log App

**Duel Log App** は、遊戯王マスターデュエルの戦績を効率的に管理・分析するためのWebアプリケーションです。対戦履歴の登録から統計分析、デッキ管理まで幅広い機能を提供し、プレイヤーの戦績向上をサポートします。

---

## 🌐 本番環境

本アプリケーションは以下のURLで公開されています：

- **フロントエンド**: https://duel-log-app.vercel.app/
- **バックエンドAPI**: https://duel-log-app.onrender.com
- **APIドキュメント**: https://duel-log-app.onrender.com/docs

### デプロイ環境

| サービス | プラットフォーム | URL |
|---------|--------------|-----|
| フロントエンド | Vercel | https://duel-log-app.vercel.app/ |
| バックエンド | Render | https://duel-log-app.onrender.com |
| データベース | Render (PostgreSQL) | - |

---

## 🚀 主な機能

- **ダッシュボード**: ゲームモード（ランク、レート、イベント、DC）ごとの対戦履歴と各種統計情報（勝率、先行/後攻率など）を一覧表示
- **対戦記録**: 使用デッキ、相手デッキ、勝敗、先攻/後攻、ランク/レートなど、詳細な対戦データを記録・編集・削除
- **デッキ管理**: 自分のデッキと、対戦相手のデッキを分けて登録・管理
- **統計分析**: デッキの分布（月間、直近）や、デッキ間の相性を円グラフや表で視覚的に分析
- **ユーザー管理**: 安全なユーザー登録、ログイン機能
- **プロフィール管理**: ユーザー名、メールアドレス、パスワードの変更、およびアカウントの削除機能
- **パスワードリセット**: メールによるパスワード再設定機能

---

## ⚙️ 技術スタック

### バックエンド
- **フレームワーク**: FastAPI
- **言語**: Python 3.11
- **ORM**: SQLAlchemy
- **バリデーション**: Pydantic
- **マイグレーション**: Alembic
- **認証**: JWT (JSON Web Tokens) with HttpOnly Cookies
- **パスワードハッシュ化**: bcrypt

### フロントエンド
- **フレームワーク**: Vue.js 3 (Composition API)
- **言語**: TypeScript
- **ビルドツール**: Vite
- **UIフレームワーク**: Vuetify 3
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **HTTP通信**: Axios
- **チャート**: ApexCharts

### データベース
- **RDBMS**: PostgreSQL

### インフラ・デプロイ
- **コンテナ**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **ホスティング**: 
  - フロントエンド: Vercel
  - バックエンド: Render
  - データベース: Render PostgreSQL

---

## 🏁 ローカル開発環境のセットアップ

Dockerがインストールされていれば、簡単なステップでローカル開発環境を起動できます。

### 前提条件

- Docker Desktop (Windows/Mac) または Docker Engine (Linux)
- Docker Compose
- Git

### 1. リポジトリのクローン

```bash
git clone https://github.com/krtw00/duel-log-app.git
cd duel-log-app
```

### 2. 環境変数の設定

`.env.example` ファイルをコピーして `.env` ファイルを作成します。

```bash
cp .env.example .env
```

次に、`.env` ファイルを開き、`SECRET_KEY` の値を生成したものに置き換えてください。

**Linux/macOSの場合:**
```bash
# ターミナルで以下のコマンドを実行し、生成された文字列をSECRET_KEYに設定
openssl rand -hex 32
```

**Windowsの場合:**
PowerShellで以下のコマンドを実行：
```powershell
-join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3. アプリケーションの起動

以下のコマンドを実行すると、必要なDockerイメージのビルド、コンテナの起動、データベースのマイグレーションが**すべて自動的に**行われます。

```bash
docker-compose up -d --build
```

### 4. アプリケーションへのアクセス

- **フロントエンド**: http://localhost:5173
- **バックエンドAPIドキュメント (Swagger UI)**: http://localhost:8000/docs
- **バックエンドAPIドキュメント (ReDoc)**: http://localhost:8000/redoc

### 5. 停止とクリーンアップ

```bash
# コンテナの停止
docker-compose down

# コンテナとボリュームの削除
docker-compose down -v
```

---

## 📁 プロジェクト構造

```
duel-log-app/
├── backend/                # バックエンド (FastAPI)
│   ├── alembic/           # データベースマイグレーション
│   ├── app/
│   │   ├── api/           # APIエンドポイント
│   │   ├── core/          # コア機能（設定、セキュリティ）
│   │   ├── db/            # データベース接続
│   │   ├── models/        # SQLAlchemyモデル
│   │   ├── schemas/       # Pydanticスキーマ
│   │   ├── services/      # ビジネスロジック
│   │   └── main.py        # アプリケーションエントリーポイント
│   ├── tests/             # テストコード
│   ├── requirements.txt   # Python依存関係
│   └── Dockerfile         # Dockerイメージ定義
├── frontend/              # フロントエンド (Vue.js)
│   ├── src/
│   │   ├── assets/        # 静的アセット
│   │   ├── components/    # Vueコンポーネント
│   │   ├── router/        # ルーティング設定
│   │   ├── services/      # API通信
│   │   ├── stores/        # Pinia状態管理
│   │   ├── types/         # TypeScript型定義
│   │   ├── utils/         # ユーティリティ関数
│   │   ├── views/         # ページコンポーネント
│   │   └── main.ts        # エントリーポイント
│   ├── package.json       # Node.js依存関係
│   └── Dockerfile         # Dockerイメージ定義
├── docs/                  # ドキュメント
├── .github/               # GitHub Actions設定
├── docker-compose.yml     # Docker Compose設定
├── .env.example           # 環境変数サンプル
└── README.md             # このファイル
```

---

## 🧪 テスト

### バックエンドのテスト

```bash
# Dockerコンテナ内でテストを実行
docker-compose exec backend pytest

# カバレッジレポート付きで実行
docker-compose exec backend pytest --cov=app --cov-report=html
```

### フロントエンドのテスト

```bash
# フロントエンドディレクトリに移動
cd frontend

# テストを実行
npm run test

# カバレッジレポート付きで実行
npm run test:coverage
```

---

## 🚢 デプロイ

### フロントエンド (Vercel)

1. Vercelアカウントにログイン
2. GitHubリポジトリを接続
3. `frontend`ディレクトリをルートディレクトリに設定
4. 環境変数を設定：
   - `VITE_API_URL`: バックエンドAPIのURL

詳細は `frontend/VERCEL_ENV_SETUP.md` を参照。

### バックエンド (Render)

1. Renderアカウントにログイン
2. 新しいWeb Serviceを作成
3. GitHubリポジトリを接続
4. `backend`ディレクトリをルートディレクトリに設定
5. 環境変数を設定：
   - `DATABASE_URL`: PostgreSQL接続URL
   - `SECRET_KEY`: JWT署名用秘密鍵
   - `ENVIRONMENT`: `production`
   - `FRONTEND_URL`: フロントエンドのURL

詳細は `backend/RENDER_CORS_SETUP.md` を参照。

---

## 🛡️ セキュリティ

本アプリケーションでは、以下のセキュリティ対策を実装しています：

### 認証・認可
- **JWT認証**: HttpOnlyクッキーを使用した安全なトークン管理
- **パスワードハッシュ化**: bcryptアルゴリズムによる強力なハッシュ化
- **CORS設定**: クロスオリジンリクエストの適切な制御

### データ保護
- **HttpOnlyクッキー**: XSS攻撃からトークンを保護
- **SameSite属性**: CSRF攻撃の防止
- **Secure属性**: HTTPS経由でのみクッキーを送信（本番環境）

### その他
- **環境変数**: 機密情報の安全な管理
- **入力バリデーション**: Pydanticによる厳格なバリデーション
- **SQLインジェクション対策**: SQLAlchemy ORMの使用

詳細は `docs/SECURITY_IMPROVEMENTS.md` を参照してください。

---

## 📖 ドキュメント

プロジェクトに関する詳細なドキュメントは `docs/` ディレクトリにあります：

### 一般
- `PROJECT_OVERVIEW.md` - プロジェクト概要
- `ER図.md` - データベース設計

### バックエンド
- `backend/CORS_FIX_QUICKSTART.md` - CORS設定ガイド
- `backend/RENDER_CORS_SETUP.md` - Render環境でのCORS設定
- `backend/LOGIN_REDIRECT_FIX.md` - ログイン後の画面遷移修正
- `backend/PASSWORD_RESET_IMPLEMENTATION.md` - パスワードリセット機能実装ガイド

### フロントエンド
- `frontend/ENV_SETUP_GUIDE.md` - 環境変数設定ガイド
- `frontend/VERCEL_ENV_SETUP.md` - Vercel環境変数設定ガイド
- `frontend/README.md` - フロントエンド詳細

### セキュリティ
- `docs/SECURITY_IMPROVEMENTS.md` - セキュリティ改善の詳細
- `docs/JWT認証実装ガイド.md` - JWT認証実装の詳細

---

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

### 開発フロー

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は `LICENSE` ファイルを参照してください。

---

## 👤 作成者

- **GitHub**: [@krtw00](https://github.com/krtw00)

---

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています：

- [FastAPI](https://fastapi.tiangolo.com/)
- [Vue.js](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)

---

## 📞 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/krtw00/duel-log-app/issues)で報告してください。
