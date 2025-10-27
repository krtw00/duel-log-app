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

## Git運用ルール

本プロジェクトでは、品質を保ちつつ効率的に開発を進めるため、GitHub Flowに基づいた以下のGit運用ルールを定めます。

### 1. `main`ブランチは常に安定させる

-   `main`ブランチは、常にデプロイ可能で安定した状態を保ちます。
-   `main`ブランチへの直接の`push`は**禁止**です。すべての変更は、後述するPull Requestを通じて反映させます。

### 2. 作業は必ず新しいブランチで行う

-   機能追加、バグ修正、リファクタリングなど、作業の種類に関わらず、必ず`main`ブランチから新しいブランチを作成してください。
-   ブランチ名は、作業内容が分かりやすいように `[種別]/[内容]` の形式で命名します。
    -   **機能追加:** `feature/add-user-profile`
    -   **バグ修正:** `fix/login-form-validation`
    -   **ドキュメント:** `docs/update-readme`

### 3. Pull Requestでレビューを受ける

-   作業が完了したら、`main`ブランチへのPull Requestを作成し、もう一人の開発者にレビューを依頼します。
-   Pull Requestの概要欄には、変更の目的や内容を分かりやすく記載してください。
-   レビューで承認（Approve）されたら、Pull Requestをマージして`main`ブランチに反映します。マージ後は作業ブランチを削除してください。

### 4. コミットメッセージの規約

-   コミットメッセージは、変更内容がひと目で分かるように[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)の規約に従ってください。
    -   **例:** `feat(frontend): ユーザープロフィールページを追加`
    -   **例:** `fix(backend): IDの重複エラーを修正`

より詳細なガイドラインについては、[開発ガイドライン](docs/development-guide.md)を参照してください。

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

## OBS オーバーレイ機能

本アプリケーションは、ライブ配信ソフトウェア（OBSなど）にデュエルの統計情報をリアルタイムで表示するためのオーバーレイ機能を提供します。

### 主な機能

- **リアルタイム統計表示**: 現在使用中のデッキ、勝率、先攻/後攻勝率などを配信画面に表示。
- **柔軟なカスタマイズ**: URLのクエリパラメータを変更することで、表示する情報の種類、集計期間、レイアウト、テーマを自由にカスタマイズ可能。
- **プライバシー保護**: 認証には専用のトークンを使用するため、メールアドレスなどの個人情報が漏洩する心配がありません。

### 設定方法

1. **プロファイルページからトークンを取得**: アプリケーションのプロファイルページにアクセスし、OBS連携用のトークンをコピーします。
2. **OBSでブラウザソースを追加**: OBSの「ソース」パネルで「ブラウザ」を追加し、以下のURLをベースに設定します。

```
https://your-frontend-domain.com/obs-overlay?token=[あなたのトークン]
```

### カスタマイズ可能な項目（クエリパラメータ）

| パラメータ        | 説明                                                                                                                                                                                                 | 例                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `token`             | **（必須）** プロファイルページで取得した認証トークン。                                                                                                                                                     | `?token=obs_token_xxxx`                                            |
| `period_type`     | 集計期間の種類を指定します。<br> `monthly`: 月間<br> `recent`: 直近<br> `from_start`: 全期間（デフォルト）                                                                                                     | `&period_type=recent`                                              |
| `year`, `month`     | `period_type=monthly` の場合に、対象の年月を指定します。                                                                                                                                               | `&year=2023&month=10`                                              |
| `limit`             | `period_type=recent` の場合に、直近何件のデュエルを対象とするかを指定します。（デフォルト: 30）                                                                                                          | `&limit=50`                                                        |
| `game_mode`         | `ranked`, `event`, `free` など、特定のゲームモードの統計のみを表示します。                                                                                                                                | `&game_mode=ranked`                                                |
| `display_items`     | 表示したい統計項目をカンマ区切りで指定します。<br> **指定可能な項目**: `current_deck`, `current_rank`, `win_rate`, `first_turn_win_rate`, `second_turn_win_rate`, `coin_win_rate`, `go_first_rate` | `&display_items=current_deck,win_rate`                             |
| `layout`            | オーバーレイのレイアウト。<br> `grid`: グリッド（デフォルト）<br> `horizontal`: 横一列<br> `vertical`: 縦一列                                                                                              | `&layout=horizontal`                                               |
| `theme`             | `dark`: ダークテーマ（デフォルト）<br> `light`: ライトテーマ                                                                                                                                             | `&theme=light`                                                     |
| `refresh`           | 統計情報を自動更新する間隔（ミリ秒）。（デフォルト: 30000ms）                                                                                                                                              | `&refresh=15000`                                                   |

### URL設定例

直近50戦のランクマッチについて、使用デッキ、勝率、先攻勝率を横一列のライトテーマで表示し、15秒ごとに更新する場合：

```
https://your-frontend-domain.com/obs-overlay?token=[あなたのトークン]&period_type=recent&limit=50&game_mode=ranked&display_items=current_deck,win_rate,first_turn_win_rate&layout=horizontal&theme=light&refresh=15000
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細については [LICENSE](LICENSE) ファイルを参照してください。