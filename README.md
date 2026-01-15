# Duel Log App

## 概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・管理し、詳細な統計情報を分析するためのWebアプリケーションです。自分のデッキと相手のデッキの相性、勝率、ゲームモードごとのパフォーマンスなどを視覚的に把握できます。

## 機能

### コア機能

- **ユーザー認証**: Supabase Authによる安全な認証（メール/パスワード、Google OAuth、Discord OAuth対応）
- **対戦履歴の記録**: 使用デッキ、相手デッキ、勝敗、先攻/後攻、コイントス結果、ゲームモード（ランク、レート、イベント、DC）、ランク/レート/DC値、対戦日時、メモなどを詳細に記録
- **デッキ管理**: 自分のデッキと相手のデッキを登録・管理・アーカイブ
- **統計情報の可視化**:
    - 総合勝率、先攻/後攻勝率、ゲームモード別勝率
    - 月間・直近の相手デッキ分布
    - デッキ相性表
    - 時系列でのレート/DC値の推移
- **CSVインポート/エクスポート**: 対戦履歴のCSV形式での一括インポートおよびエクスポート
- **プロフィール管理**: メールアドレス、パスワードの変更、アカウントの削除
- **テーマ切り替え**: ライトモードとダークモードのテーマ切り替え

### 配信者向け機能

- **配信者モード**: ライブ配信時にメールアドレスなどの個人情報を自動的にマスク
- **OBSオーバーレイ**: 統計情報をOBSにリアルタイム表示（後述）
- **配信者向けポップアップ**: ゲームモード連携のポップアップウィンドウ表示（後述）
- **統計情報の共有**: 特定の期間の統計情報を共有可能なURLを生成

### 管理者機能

- **ユーザー管理**: ユーザー一覧表示、管理者権限の付与/削除
- **デッキマージ**: アーカイブ済みデッキの自動統合機能

### 画面録画分析（試験的機能）

ブラウザの画面共有機能を使用して、ゲーム画面から以下を自動検出：
- コイントス結果（勝ち/負け）
- 勝敗判定（VICTORY/LOSE）
- 複数解像度対応（720p〜2160p）

プロフィール設定で有効化できます。

## OBS オーバーレイ機能

ライブ配信ソフトウェア（OBS Studioなど）にデュエルの統計情報をリアルタイムで表示するためのオーバーレイ機能を提供します。

### 主な機能

- **リアルタイム統計表示**: 現在使用中のデッキ、勝率、先攻/後攻勝率などを配信画面に表示
- **柔軟なカスタマイズ**: URLのクエリパラメータを変更することで、表示する情報の種類、集計期間、レイアウト、テーマを自由にカスタマイズ可能
- **プライバシー保護**: 認証には専用のトークンを使用するため、メールアドレスなどの個人情報が漏洩する心配がありません

### 設定方法

1. **プロファイルページからトークンを取得**: アプリケーションのプロファイルページにアクセスし、OBS連携用のトークンをコピーします。
2. **OBSでブラウザソースを追加**: OBSの「ソース」パネルで「ブラウザ」を追加し、以下のURLをベースに設定します。

```
https://your-frontend-domain.com/obs-overlay?token=[あなたのトークン]
```

### カスタマイズ可能な項目（クエリパラメータ）

| パラメータ | 説明 | 例 |
| --- | --- | --- |
| `token` | **（必須）** プロファイルページで取得した認証トークン。 | `?token=obs_token_xxxx` |
| `period_type` | 集計期間の種類を指定します。<br> `monthly`: 月間<br> `recent`: 直近<br> `from_start`: 全期間（デフォルト） | `&period_type=recent` |
| `year`, `month` | `period_type=monthly` の場合に、対象の年月を指定します。 | `&year=2023&month=10` |
| `limit` | `period_type=recent` の場合に、直近何件のデュエルを対象とするかを指定します。（デフォルト: 30） | `&limit=50` |
| `start_id` | `period_type=from_start` の場合に、集計を開始するデュエルIDを指定します。指定しない場合は最新のデュエルから集計します。 | `&start_id=123` |
| `game_mode` | `ranked`, `event`, `free` など、特定のゲームモードの統計のみを表示します。 | `&game_mode=ranked` |
| `display_items` | 表示したい統計項目をカンマ区切りで指定します。<br> **指定可能な項目**: `current_deck_name`, `current_rank`, `total_duels`, `win_rate`, `first_turn_win_rate`, `second_turn_win_rate`, `coin_win_rate`, `go_first_rate` | `&display_items=current_deck_name,win_rate` |
| `layout` | オーバーレイのレイアウト。<br> `grid`: グリッド（デフォルト）<br> `horizontal`: 横一列<br> `vertical`: 縦一列 | `&layout=horizontal` |
| `theme` | `dark`: ダークテーマ（デフォルト）<br> `light`: ライトテーマ | `&theme=light` |
| `refresh` | 統計情報を自動更新する間隔（ミリ秒）。（デフォルト: 30000ms） | `&refresh=15000` |

### URL設定例

直近50戦のランクマッチについて、使用デッキ、勝率、先攻勝率を横一列のライトテーマで表示し、15秒ごとに更新する場合：

```
https://your-frontend-domain.com/obs-overlay?token=[あなたのトークン]&period_type=recent&limit=50&game_mode=ranked&display_items=current_deck_name,win_rate,first_turn_win_rate&layout=horizontal&theme=light&refresh=15000
```

## 配信者向けポップアップ機能

OBSのポップアップウィンドウとして使用できる設定パネルを提供します。

### 主な機能

- **ゲームモード連携**: RANK/RATE/EVENT/DC に応じた表示切替
- **レイアウト選択**: grid/horizontal/vertical
- **ローカルストレージ保存**: 設定が自動保存されます
- **テーマ対応**: ライト/ダークテーマ

### アクセス方法

```
https://your-frontend-domain.com/streamer-popup
```

## 技術スタック

### バックエンド

- **言語**: Python 3.11+
- **フレームワーク**: FastAPI
- **ASGIサーバー**: Uvicorn
- **データベース**: PostgreSQL (Supabase)
- **ORM**: SQLAlchemy 2.0
- **データバリデーション**: Pydantic v2
- **マイグレーション**: Alembic
- **認証**: Supabase Auth (OAuth, JWT)
- **テスト**: Pytest
- **リンター/フォーマッター**: Ruff, Black

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: Vue.js 3 (Composition API)
- **ビルドツール**: Vite
- **UIフレームワーク**: Vuetify 3
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **HTTP通信**: Axios
- **チャート**: ApexCharts
- **認証**: Supabase Client
- **テスト**: Vitest
- **リンター/フォーマッター**: ESLint, Prettier
- **CSSプリプロセッサ**: Sass

## 開発環境のセットアップ

開発環境は Supabase CLI を使用します。

### 前提条件

- **Docker Desktop**: Supabase CLIのローカル環境に必要
- **Node.js**: v18以上（nvm推奨）
- **Python**: 3.11以上
- **Supabase CLI**: `npm install -g supabase`

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/krtw00/duel-log-app.git
cd duel-log-app
```

### Step 2: 全サービスを一括起動

Docker Desktop が起動していることを確認してから実行してください。

```bash
./scripts/dev.sh
```

このスクリプトは以下を自動的に実行します：
1. ローカル Supabase 環境の起動
2. バックエンドの依存関係インストールとサーバー起動
3. フロントエンドの依存関係インストールとサーバー起動

### Step 3: 動作確認

以下のURLにアクセスして動作を確認してください。

| サービス | URL |
|----------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://127.0.0.1:8000 |
| API ドキュメント (Swagger) | http://127.0.0.1:8000/docs |
| Supabase Studio | http://127.0.0.1:55323 |
| Mailpit（メールテスト） | http://127.0.0.1:55324 |

### 個別起動（オプション）

```bash
./scripts/dev-supabase.sh     # Supabaseのみ起動
./scripts/dev-backend.sh      # バックエンドのみ起動（要Supabase起動済み）
./scripts/dev-frontend.sh     # フロントエンドのみ起動
```

### 開発環境の停止

```bash
./scripts/dev-stop.sh         # Supabaseを停止
# Ctrl+C でバックエンド/フロントエンドを停止
```

### ローカルSupabase接続情報

| 項目 | 値 |
|------|-----|
| データベース | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Supabase API | `http://127.0.0.1:55321` |

## Git運用ルール

本プロジェクトでは、`main`ブランチの安定性を確保しつつ、効率的に並行開発を進めるため、`develop`ブランチを導入したブランチ戦略を採用します。

- **`main`**: 常に本番環境にデプロイ可能な、最も安定したブランチです。
- **`develop`**: 次期リリースに向けた開発の統合ブランチです。機能開発はこちらのブランチを基点に行います。
- **フィーチャーブランチ**: 新機能の開発やバグ修正は、`develop`ブランチから `feature/your-feature` や `fix/login-error` のような名前でブランチを作成して行います。作業完了後、`develop`ブランチへのプルリクエストを作成してください。

コミットメッセージの規約など、より詳細なルールについては、[開発ガイドライン](docs/development-guide.md)を参照してください。

## Pre-commit Hooks のセットアップ

本プロジェクトでは、コミット前に自動的にコード品質チェックを実行するため、pre-commit hooksを導入しています。

### セットアップ手順

```bash
# pre-commitツールをインストール
pip install pre-commit

# pre-commit hooksを有効化（プロジェクトルートで実行）
pre-commit install
```

### 動作確認

```bash
pre-commit run --all-files
```

### 自動実行される品質チェック

コミット時に以下のチェックが自動的に実行されます:

- **バックエンド (Python)**
  - Black: コードフォーマット
  - Ruff: リンティング（自動修正あり）
  - Ruff Format: フォーマット

- **フロントエンド (TypeScript/Vue)**
  - Prettier: コードフォーマット

- **共通**
  - 末尾の空白削除
  - ファイル末尾の改行チェック
  - YAML/JSON/TOML構文チェック
  - マージコンフリクトマーカーのチェック
  - 大きなファイルの追加チェック（1MB以上）

## バグ報告・機能要望

本プロジェクトでは、GitHub Issues を使った日本語のバグトラッキングシステムを提供しています。

### バグを見つけたら

1. [Issues ページ](https://github.com/krtw00/duel-log-app/issues) にアクセス
2. **「New issue」** をクリック
3. **「バグ報告」** または **「機能要望」** を選択
4. フォームに必要事項を入力して送信

非エンジニアの方でも簡単に報告できるように、選択式のフォームを用意しています。

## ドキュメント

- **[開発ガイドライン](docs/development-guide.md)**: ブランチ戦略、テスト方針など
- **[デプロイ手順書](docs/deployment.md)**: 本番環境へのデプロイ手順
- **[APIリファレンス](docs/api-reference.md)**: バックエンドAPIの詳細
- **[データベーススキーマ](docs/db-schema.md)**: テーブル構造の詳細
- **[エラーハンドリング設計](docs/error-handling.md)**: エラーハンドリングの方針
- **[機能実装状況](docs/README.md)**: 各機能の実装状況一覧

## デプロイ

| 環境 | サービス |
|------|----------|
| フロントエンド | Vercel |
| バックエンド | Render (Docker) |
| データベース | Supabase Cloud (PostgreSQL) |
| 認証 | Supabase Auth |
| CI/CD | GitHub Actions |

詳細は [デプロイ手順書](docs/deployment.md) を参照してください。

## 計画中の機能

- **多言語対応**: 日本語、英語、韓国語対応（vue-i18n v9.x）
- **アプリ内フィードバック**: ヘルプメニューからのバグ報告・機能要望
- **システム統計ダッシュボード**: 管理者向けシステム全体の統計表示

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細については [LICENSE](LICENSE) ファイルを参照してください。
