# Duel Log App - プロジェクト概要

このドキュメントは、Yu-Gi-Oh! マスターデュエルの戦績管理・分析アプリケーション「Duel Log App」のバックエンドとフロントエンドの全体像を説明します。プロジェクトの技術スタック、アーキテクチャ、主要機能、開発手順、および今後の課題について概説します。

## 1. プロジェクト概要

**Duel-Log-App** は、Yu-Gi-Oh! マスターデュエルの戦績を効率的に管理・分析するための Web アプリケーションです。対戦履歴の登録から統計分析、デッキ管理、データ共有まで幅広い機能を提供し、プレイヤーの戦績向上をサポートします。

## 2. バックエンド (FastAPI)

### 2.1. 概要と目的

FastAPI を使用して構築された RESTful API で、フロントエンドからのリクエストを処理し、PostgreSQL データベースとのデータ永続化を担当します。ユーザー認証、デッキ管理、デュエル記録の CRUD 操作、および統計計算などのビジネスロジックを提供します。

### 2.2. 主要技術スタック

*   **フレームワーク**: FastAPI (0.111.1)
*   **ORM**: SQLAlchemy (2.0.22)
*   **マイグレーション**: Alembic (1.11.1)
*   **認証**: Passlib (bcrypt), python-jose (JWT)
*   **データベース**: PostgreSQL 15
*   **サーバー**: Uvicorn (0.24.0)
*   **コンテナ**: Docker, Docker Compose

### 2.3. アーキテクチャとディレクトリ構造

バックエンドは、クリーンアーキテクチャの原則に基づき、責務が明確に分離されたレイヤー構造を採用しています。

```
backend/
├── alembic/              # データベースマイグレーションスクリプト
├── app/
│   ├── api/              # APIエンドポイント定義
│   │   ├── deps.py       # 共通の依存性注入 (DBセッション、現在のユーザー取得など)
│   │   └── routers/      # 各リソースのルーター (auth, decks, duels, me, users)
│   ├── core/             # コア機能、設定、ユーティリティ
│   │   ├── config.py     # アプリケーション設定 (Pydantic Settings)
│   │   ├── security.py   # パスワードハッシュ、JWT生成・検証
│   │   ├── logging_config.py # ロギング設定
│   │   ├── exception_handlers.py # グローバル例外ハンドラー
│   │   └── exceptions/   # カスタム例外クラス
│   ├── db/               # データベース接続、セッション管理
│   │   └── session.py
│   ├── models/           # SQLAlchemy ORMモデル (user, deck, duel, sharedUrl)
│   ├── schemas/          # Pydantic スキーマ (データ検証、シリアライズ/デシリアライズ)
│   ├── services/         # ビジネスロジック層
│   │   ├── base/         # 共通CRUD操作を提供する基底サービスクラス
│   │   └── (deck_service.py, duel_service.py, user_service.py) # 各リソースのサービスクラス
│   ├── auth.py           # 後方互換性のため残存 (deps.pyへ移行済み)
│   └── main.py           # FastAPIアプリケーションエントリーポイント、ミドルウェア、ルーター登録
├── Dockerfile            # Dockerイメージ定義
├── requirements.txt      # Python依存パッケージリスト
├── pyproject.toml        # pytest設定など
└── wait-for-db.sh        # データベース起動待機スクリプト
```

### 2.4. 主要機能

*   **ユーザー管理**: 登録、ログイン、プロフィール取得、更新、削除。
*   **認証**: JWT (JSON Web Token) を使用したセキュアな認証システム。パスワードは bcrypt でハッシュ化。
*   **デッキ管理**: ユーザーごとのデッキの作成、取得、更新、削除。自分のデッキと相手のデッキを区別する機能。
*   **デュエル記録**: 対戦記録の作成、取得、更新、削除。使用デッキ、相手デッキ、勝敗、先攻/後攻、ランク、メモなどを記録。
*   **統計**: 勝率計算 (全体、デッキ別)。
*   **フィルタリング**: デュエル記録のデッキID、日付範囲によるフィルタリング。デッキの `is_opponent` フラグによるフィルタリング。
*   **ヘルスチェック**: `/health` エンドポイントによるアプリケーションの状態監視。
*   **エラーハンドリング**: カスタム例外とグローバル例外ハンドラーによる統一されたエラーレスポンス。
*   **ロギング**: 集中管理されたロギング設定と環境変数によるログレベル制御。

### 2.5. 開発ガイド

#### 2.5.1. 環境セットアップ

1.  **リポジトリのクローン**:
    ```bash
    git clone <repository-url>
    cd duel-log-app
    ```
2.  **環境変数の設定**: `.env.example` を参考に `.env` ファイルを作成し、`DATABASE_URL`, `SECRET_KEY` などを設定します。
    ```bash
    cp .env.example .env
    # SECRET_KEYは openssl rand -hex 32 で生成
    ```
3.  **Docker コンテナの起動**:
    ```bash
    docker-compose up -d --build
    ```
    これにより、PostgreSQL、バックエンドサービスが起動し、Alembic マイグレーションが自動的に実行されます。

#### 2.5.2. マイグレーション

*   新しいマイグレーションファイルの作成: `docker-compose exec backend alembic revision --autogenerate -m "description"`
*   マイグレーションの適用: `docker-compose exec backend alembic upgrade head`
*   マイグレーションの取り消し: `docker-compose exec backend alembic downgrade -1`

#### 2.5.3. テスト

`backend/tests/` ディレクトリに pytest を使用したテストコードがあります。
*   テストの実行: `docker-compose exec backend pytest`
*   カバレッジレポート付きで実行: `docker-compose exec backend pytest --cov=app --cov-report=html`

#### 2.5.4. APIドキュメント

アプリケーション起動後、ブラウザで `http://localhost:8000/docs` にアクセスすると Swagger UI でAPIドキュメントを確認できます。

## 3. フロントエンド (Vue.js)

### 3.1. 概要と目的

Vue.js 3 と TypeScript を使用して構築されたシングルページアプリケーション (SPA) です。バックエンドAPIと連携し、ユーザーフレンドリーなインターフェースを通じてデュエル記録の管理、統計表示、デッキ管理機能を提供します。サイバーパンク風のモダンなUIデザインが特徴です。

### 3.2. 主要技術スタック

*   **フレームワーク**: Vue.js 3.5 (Composition API)
*   **UIライブラリ**: Vuetify 3.9
*   **状態管理**: Pinia 2.1
*   **ルーティング**: Vue Router 4
*   **HTTPクライアント**: Axios 1.12
*   **ビルドツール**: Vite 4.5
*   **言語**: TypeScript 5.4
*   **スタイリング**: SCSS, Material Design Icons

### 3.3. アーキテクチャとディレクトリ構造

フロントエンドは、Vue.js の標準的なプロジェクト構造と、機能ごとのモジュール化を採用しています。

```
frontend/
├── public/                 # 静的アセット
├── src/
│   ├── assets/             # 画像、スタイルシートなどのアセット
│   │   └── styles/         # グローバルSCSSスタイル
│   ├── components/         # 再利用可能なUIコンポーネント
│   │   ├── duel/           # デュエル関連コンポーネント (StatCard, DuelTable, DuelFormDialog)
│   │   └── layout/         # レイアウト関連コンポーネント (AppBar)
│   ├── plugins/            # Vueプラグイン設定 (Vuetify)
│   ├── router/             # Vue Router 設定 (ルーティング定義、ナビゲーションガード)
│   │   └── index.ts
│   ├── services/           # APIクライアント、外部サービス連携
│   │   └── api.ts          # Axiosインスタンス、インターセプター
│   ├── stores/             # Pinia ストア (認証状態管理など)
│   │   └── auth.ts
│   ├── types/              # TypeScript 型定義
│   │   └── index.ts
│   ├── utils/              # ユーティリティ関数 (ランク変換など)
│   │   └── ranks.ts
│   ├── views/              # ルーティングされる主要なページコンポーネント
│   │   ├── DashboardView.vue # ダッシュボード (統計、デュエル一覧)
│   │   ├── DecksView.vue     # デッキ管理画面
│   │   ├── LoginView.vue     # ログイン画面
│   │   └── RegisterView.vue  # 新規登録画面
│   ├── App.vue             # ルートコンポーネント
│   └── main.ts             # アプリケーションエントリーポイント
├── .env                    # 環境変数 (VITE_API_URLなど)
├── index.html              # HTMLエントリーポイント
├── package.json            # パッケージ管理
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Vite設定 (エイリアス、プロキシなど)
```

### 3.4. 主要機能

*   **認証**: ログイン、新規登録、JWTトークンによるセッション管理、自動ログアウト。
*   **ダッシュボード**: 総試合数、勝率、先攻/後攻勝率、コイントス勝率などの統計情報の表示。
*   **デュエル記録**: 対戦記録の追加、編集、削除。
*   **デッキ管理**: 自分のデッキと相手のデッキの作成、編集、削除。
*   **UI/UX**:
    *   ダークテーマベースのサイバーパンク風デザイン。
    *   グラデーション、グローエフェクト、スムーズなアニメーション。
    *   レスポンシブデザイン対応。
*   **データ表示**: 対戦履歴のテーブル表示 (ソート可能)。

### 3.5. 開発ガイド

#### 3.5.1. 環境セットアップ

1.  **依存パッケージのインストール**:
    ```bash
    cd frontend
    npm install
    ```
2.  **開発サーバーの起動**:
    ```bash
    npm run dev
    ```
    ブラウザで `http://localhost:5173` にアクセスします。

#### 3.5.2. ビルド

本番環境向けにアプリケーションをビルドするには:
```bash
cd frontend
npm run build
```
ビルドされた静的ファイルは `dist/` ディレクトリに出力されます。

#### 3.5.3. 認証フロー

1.  ユーザーがログイン画面でメールアドレスとパスワードを入力。
2.  `authStore.login` を通じてバックエンドAPI (`/auth/login`) にリクエストを送信。
3.  成功した場合、バックエンドから JWT アクセストークンを受け取り、`localStorage` に保存。
4.  `fetchUser` を呼び出し、`/me` エンドポイントからユーザー情報を取得し、Pinia ストアに保存。
5.  以降のAPIリクエストには `axios` インターセプターが自動的に `Authorization: Bearer <token>` ヘッダーを付与。
6.  401 (Unauthorized) エラーが発生した場合、トークンを削除しログイン画面へリダイレクト。

## 4. 今後の課題

### 優先度：高
- **統計・分析機能の強化**: より詳細な統計グラフ (勝率推移、デッキ別勝率、相手デッキ分布など) の実装。
- **データエクスポート機能**: CSV や JSON 形式でのデータエクスポート対応。
- **共有機能の実装**: URL を介した戦績共有画面の提供。
- **統合テストの作成**: バックエンドとフロントエンド間の連携を含むテスト。
- **エラーハンドリングの統一と強化**: 全体的なエラーレスポンスの標準化と詳細化。
- **バリデーションの強化**: 入力データの厳密な検証。

### 優先度：中
- **リフレッシュトークンの実装**: JWTのセキュリティ強化とセッション管理の改善。
- **セキュアなトークン保存戦略**: HttpOnly Cookieなどを用いたフロントエンドでのトークン管理。
- **パフォーマンス最適化**: APIレスポンス速度の改善、データベースクエリの最適化、フロントエンドのレンダリング最適化。
- **API ドキュメントの充実**: OpenAPI (Swagger UI) の詳細化と最新化。
- **デッキ管理画面の強化**: デッキのアーキタイプ、メモなどの詳細情報管理。

### 優先度：低
- **Railway へのデプロイ設定**: 本番環境へのデプロイ自動化。
- **フロントエンドのユニットテスト**: Vueコンポーネントやストアのテスト。
- **E2Eテスト**: CypressやPlaywrightなどを用いたエンドツーエンドテスト。
- **多言語対応**: アプリケーションの多言語化。
- **パスワードリセット機能**: ユーザーがパスワードをリセットできる機能。
