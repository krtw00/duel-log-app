# Duel Log App

## 概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・管理し、詳細な統計情報を分析するためのWebアプリケーションです。自分のデッキと相手のデッキの相性、勝率、ゲームモードごとのパフォーマンスなどを視覚的に把握できます。

## 機能

- **ユーザー認証**: 安全なログイン、新規登録、パスワードリセット機能を提供します。
- **対戦履歴の記録**: 使用デッキ、相手デッキ、勝敗、先攻/後攻、コイントス結果、ゲームモード（ランク、レート、イベント、DC）、ランク/レート/DC値、対戦日時、メモなどを詳細に記録。
- **デッキ管理**: 自分のデッキと相手のデッキを登録・管理。
- **統計情報の可視化**:
    - 総合勝率、先攻/後攻勝率、ゲームモード別勝率など
    - 月間・直近の相手デッキ分布
    - デッキ相性表
    - 時系列でのレート/DC値の推移
- **CSVインポート/エクスポート**: 対戦履歴のCSV形式での一括インポートおよびエクスポート。
- **プロフィール管理**: メールアドレス、パスワードの変更、アカウントの削除が可能です。
- **テーマ切り替え**: ライトモードとダークモードのテーマ切り替えに対応しています。
- **配信者モード**: ライブ配信時にメールアドレスなどの個人情報を自動的にマスクする機能。
- **統計情報の共有**: 特定の期間の統計情報を共有可能なURLを生成。

## OBS オーバーレイ機能

本アプリケーションは、ライブ配信ソフトウェア（OBS Studioなど）にデュエルの統計情報をリアルタイムで表示するためのオーバーレイ機能を提供します。

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

## 技術スタック

### バックエンド

- **言語**: Python 3.11+
- **フレームワーク**: FastAPI
- **ASGIサーバー**: Uvicorn
- **データベース**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **データバリデーション**: Pydantic v2
- **マイグレーション**: Alembic
- **認証**: JWT (HttpOnly Cookie), bcrypt, passlib
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
- **テスト**: Vitest
- **リンター/フォーマッター**: ESLint, Prettier
- **CSSプリプロセッサ**: Sass

## 開発環境のセットアップ (WSL + Docker)

このガイドでは、Windows Subsystem for Linux (WSL) を使用して、Windows上に開発環境を構築する手順を説明します。Docker Desktop for Windowsは不要です。

### 前提条件
- Windows 11 または Windows 10 (バージョン 2004 以降)
- Git for Windows

### Step 1: WSLとUbuntuのインストール

1. 管理者としてPowerShellまたはコマンドプロンプトを開きます。
2. 以下のコマンドを実行してWSLとデフォルトのUbuntuディストリビューションをインストールします。
   ```powershell
   wsl --install
   ```
3. PCを再起動します。再起動後、Ubuntuのインストールが自動的に続行されます。ユーザー名とパスワードを設定してください。

### Step 2: 開発ツールのインストール (WSL内)

これ以降のコマンドは、すべてWSL (Ubuntu) のターミナル内で実行します。

1. **Node.js (nvm経由) のインストール**
   `pre-commit`フックの実行やフロントエンドのライブラリ管理のためにNode.jsをインストールします。
   ```bash
   # nvm（Node Version Manager）をインストール
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

   # ターミナルを再起動するか、以下のコマンドでnvmを読み込み
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

   # 最新のLTS版Node.jsをインストール
   nvm install --lts
   ```

2. **Docker Engineのインストール**
   Dockerの公式サイトの手順に従って、Docker Engineをインストールします。
   ```bash
   # 1. パッケージリストを更新し、HTTPS経由でリポジトリを使用できるようにする
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl

   # 2. Dockerの公式GPGキーを追加
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   # 3. Dockerリポジトリを設定
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # 4. Docker Engineをインストール
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

3. **Dockerの権限設定と起動**
   ```bash
   # Dockerグループに現在のユーザーを追加（sudoなしでdockerコマンドを実行するため）
   sudo usermod -aG docker $USER

   # Dockerデーモンを起動
   sudo service docker start
   ```
   **重要:** ユーザーグループの変更を反映させるため、ここで一度WSLターミナルを閉じて、再度開いてください。再起動後、`docker ps`コマンドが`sudo`なしで実行できれば成功です。

### Step 3: プロジェクトのセットアップ

1. **リポジトリのクローン**
   Windowsのターミナルではなく、WSLのターミナル内でクローンします。
   ```bash
   git clone https://github.com/krtw00/duel-log-app.git
   cd duel-log-app
   ```

2. **環境変数の設定**
   プロジェクトルートにある `.env.example` をコピーして `.env` ファイルを作成します。
   ```bash
   cp .env.example .env
   ```
   次に、`.env` ファイルをエディタで開き、`SECRET_KEY`など必要な値を設定してください。`SECRET_KEY` は以下のコマンドで生成できます。
   ```bash
   # 32バイトのランダムな16進数文字列を生成
   openssl rand -hex 32
   ```
   `.env` ファイルの例：
   ```
   # .env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_DB=duel_log_db
   SECRET_KEY="your_super_secret_key_generated_by_openssl"
   ENVIRONMENT="development"
   FRONTEND_URL="http://localhost:5173"
   DATABASE_URL="postgresql://user:password@db:5432/duel_log_db"
   ```

3. **アプリケーションのビルドと起動**
   `docker-compose`ではなく、`docker compose` (ハイフンなし) を使用します。
   ```bash
   docker compose up --build -d
   ```

4. **データベースマイグレーションの実行**
   コンテナが起動したら、以下のコマンドでデータベースのテーブルを作成します。
   ```bash
   docker compose exec backend alembic upgrade head
   ```

### Step 4: 動作確認

これでセットアップは完了です。以下のURLにアクセスして動作を確認してください。

- **フロントエンド**: [http://localhost:5173](http://localhost:5173)
- **バックエンドAPIドキュメント (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### (オプション) シードデータの投入

初期データとしてサンプルを投入したい場合は、以下のコマンドを実行します。

```bash
docker compose exec backend python -m app.db.seed
```

### 開発環境の停止

アプリケーションを停止する際は、以下のコマンドを実行します。

```bash
docker compose down
```

ボリューム（データベースのデータなど）も完全に削除したい場合は、以下のコマンドを実行してください。
```bash
docker compose down -v
```

## Git運用ルール

本プロジェクトでは、`main`ブランチの安定性を確保しつつ、効率的に並行開発を進めるため、`develop`ブランチを導入したブランチ戦略を採用します。

- **`main`**: 常に本番環境にデプロイ可能な、最も安定したブランチです。
- **`develop`**: 次期リリースに向けた開発の統合ブランチです。機能開発はこちらのブランチを基点に行います。
- **フィーチャーブランチ**: 新機能の開発やバグ修正は、`develop`ブランチから `feature/your-feature` や `fix/login-error` のような名前でブランチを作成して行います。作業完了後、`develop`ブランチへのプルリクエストを作成してください。

コミットメッセージの規約など、より詳細なルールについては、[開発ガイドライン](docs/development-guide.md)を参照してください。

## Pre-commit Hooks のセットアップ

本プロジェクトでは、コミット前に自動的にコード品質チェックを実行するため、pre-commit hooksを導入しています。開発を開始する前に、以下の手順でセットアップしてください。

### セットアップ手順

pre-commit hooksはホストマシン上のgitリポジトリで動作するため、ホスト側にインストールします。

```bash
# pre-commitツールをインストール
pip install pre-commit

# pre-commit hooksを有効化（プロジェクトルートで実行）
pre-commit install
```

**注意**: Dockerコンテナ内部ではgitコミット操作を行わないため、コンテナ内にpre-commitをインストールする必要はありません

### 動作確認

セットアップ後、以下のコマンドで全ファイルに対してチェックを実行できます。

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

チェックに失敗した場合、自動修正可能なものは修正され、再度 `git add` してコミットし直してください。

## 開発ガイドライン

本プロジェクトにおける開発の進め方やルールについては、以下のドキュメントを参照してください。

- **[開発ガイドライン](docs/development-guide.md)**: ブランチ戦略、テスト方針など、開発プロセス全般について記載しています。
- **[コーディング規約](docs/coding-conventions.md)**: フォーマット、命名規則、コメントなど、コードを記述する際の規約を記載しています。

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

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細については [LICENSE](LICENSE) ファイルを参照してください。
