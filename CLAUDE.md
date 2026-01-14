# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・分析するWebアプリケーションです。詳細な統計情報、デッキ管理、相性分析、配信者向けのOBSオーバーレイ機能を提供します。

**技術スタック:**
- **バックエンド:** Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **フロントエンド:** TypeScript, Vue 3 (Composition API), Vuetify 3, Pinia, Vite
- **データベース/認証:** Supabase (ローカル開発はSupabase CLI、本番はSupabase Cloud)
- **テスト:** バックエンド: Pytest | フロントエンド: Vitest
- **リンター/フォーマッター:** バックエンド: Ruff, Black | フロントエンド: ESLint, Prettier

## よく使うコマンド

### ローカル開発環境（推奨）

開発環境はSupabase CLIを使用します。Docker Desktopが起動している必要があります。

```bash
# 全サービスを一括起動（Supabase + Backend + Frontend）
./scripts/dev.sh

# 個別起動
./scripts/dev-supabase.sh     # Supabaseのみ起動
./scripts/dev-backend.sh      # バックエンドのみ起動（要Supabase起動済み）
./scripts/dev-frontend.sh     # フロントエンドのみ起動

# 全サービスを停止
./scripts/dev-stop.sh         # Supabaseを停止（Ctrl+Cでバックエンド/フロントエンドは停止）
```

**起動後のURL:**
- **フロントエンド:** http://localhost:5173
- **バックエンドAPI:** http://127.0.0.1:8000
- **Supabase Studio:** http://127.0.0.1:55323
- **Mailpit（メールテスト）:** http://127.0.0.1:55324

**ローカルSupabase接続情報:**
- **データベース:** `postgresql://postgres:postgres@127.0.0.1:55322/postgres`
- **Supabase API:** `http://127.0.0.1:55321`

### バックエンド（`/backend`ディレクトリから実行）

```bash
# 開発サーバー起動
python start.py
# または、uvicornを直接使用:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# テスト実行
pytest

# カバレッジ付きでテスト実行
pytest --cov=app --cov-report=term-missing --cov-report=html

# 特定のテストファイルを実行
pytest tests/test_statistics_api.py

# 特定のテスト関数を実行
pytest tests/test_statistics_api.py::test_get_statistics

# リンティングとフォーマット
ruff check .                  # リンティングチェック
ruff check . --fix            # リンティング問題を自動修正
black .                       # コードフォーマット

# データベースマイグレーション
alembic upgrade head          # 全てのマイグレーションを適用
alembic downgrade -1          # 1つ前のマイグレーションにロールバック
alembic revision --autogenerate -m "説明"  # 新しいマイグレーションを作成
```

### フロントエンド（`/frontend`ディレクトリから実行）

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションビルドをプレビュー
npm run preview

# 全テスト実行
npm run test

# ウォッチモードでテスト実行
npm test

# ユニットテストを1回だけ実行
npm run test:unit

# リンティングとフォーマット
npm run lint                  # リンティングチェック
npm run format                # Prettierでコードフォーマット
```

## アーキテクチャ

### バックエンドアーキテクチャ

**エントリーポイント:** `backend/start.py`が以下を処理:
- データベース接続の待機
- Alembicマイグレーションの実行
- Uvicornサーバーの起動

**FastAPIアプリケーション:** `backend/app/main.py`
- 全てのルーター（auth, users, decks, duels, statistics, shared_statistics）を登録
- CORSミドルウェアの設定（Vercelプレビューデプロイメントに対応）
- グローバル例外ハンドラーのセットアップ

**APIレイヤー:** `backend/app/api/`
- `routers/` - 各ドメインのFastAPIルートハンドラー
- `deps.py` - 依存性注入関数（DBセッション、認証）

**サービスレイヤー:** `backend/app/services/`
ビジネスロジックを処理するサービスレイヤー:
- `base/` - 共通のCRUD操作を持つベースサービスクラス
- `deck_service.py` - デッキ管理（プレイヤーデッキと相手デッキ）
- `duel_service.py` - 対戦履歴のCRUD
- `statistics_service.py` - 統計情報のメインコーディネーター
- `general_stats_service.py` - 総合勝率と統計
- `win_rate_service.py` - ターン順とコイントス勝率
- `deck_distribution_service.py` - 相手デッキの出現頻度分析
- `matchup_service.py` - デッキ相性表
- `value_sequence_service.py` - レート/DC値のシーケンス生成
- `csv_service.py` - CSVインポート/エクスポート機能
- `user_service.py` - ユーザーアカウント管理
- `shared_statistics_service.py` - 統計情報共有URL生成

**モデル:** `backend/app/models/`
- `user.py` - ユーザー認証とプロフィール
- `deck.py` - デッキエンティティ（`is_opponent`フラグを持つ）
- `duel.py` - ゲームモード、ターン順、レートを含む対戦履歴
- `password_reset_token.py` - パスワードリセットトークン
- `shared_statistics.py` - 統計情報共有設定
- `sharedUrl.py` - レガシー共有URLモデル

**データベース:**
- SQLAlchemy 2.0 ORMを使用したPostgreSQL
- `backend/alembic/`でAlembicによるマイグレーション管理
- 初期マイグレーション: `5c16ff509f3d_initial_tables.py`

**認証:**
- Supabase Authを使用したユーザー認証
- JWTトークンをHttpOnly Cookieに保存
- 認証ロジックは`backend/app/auth.py`と`backend/app/core/security.py`
- OBSオーバーレイ用の独自トークン認証も併用

### フロントエンドアーキテクチャ

**エントリーポイント:** `frontend/src/main.ts`
- Vueアプリ、Piniaストア、Vue Router、Vuetifyを初期化

**状態管理:** `frontend/src/stores/`
- auth、decks、duels、statistics、theme用のPiniaストア

**APIクライアント:** `frontend/src/services/api.ts`
- 認証インターセプター付きのAxiosベースAPIクライアント
- Cookie ベースのJWT認証

**ビュー:** `frontend/src/views/`
- `LoginView.vue` / `RegisterView.vue` - 認証
- `DashboardView.vue` - 概要を表示するメインダッシュボード
- `DecksView.vue` - デッキ管理
- `StatisticsView.vue` - フィルター付き詳細統計情報
- `ProfileView.vue` - ユーザープロフィールと設定
- `OBSOverlayView.vue` - OBS配信オーバーレイ
- `SharedStatisticsView.vue` - 統計情報の公開共有

**コンポーネント:** `frontend/src/components/`
機能ドメイン（auth、decks、duels、statistics、shared）ごとに整理

**ルーティング:** `frontend/src/router/`
- 認証用のルートガード付きVue Router

**テーマ:**
- ライト/ダークモード対応のVuetifyテーマ
- 個人情報をマスクする配信者モード機能

## 重要なパターン

### バックエンドサービスパターン

サービスは`BaseService`（`backend/app/services/base/base_service.py`）を継承し、以下を提供:
- 標準CRUD操作（get、get_all、create、update、delete）
- ページネーションサポート
- データベースセッション管理

サービス使用例:
```python
from app.services.deck_service import DeckService

service = DeckService(db_session)
deck = service.get(deck_id, user_id)
```

### フロントエンドComposables

`frontend/src/composables/`内の再利用可能なロジック:
- 認証状態管理
- エラーハンドリング付きAPI呼び出し
- フォームバリデーションロジック

### 統計情報アーキテクチャ

統計情報生成は多層構造:
1. `StatisticsService`が複数の専門サービスを調整
2. 各サービスが特定の統計ドメインを処理
3. サービスは期間タイプ（monthly、recent、from_start）、ゲームモード、デッキでフィルタリング可能
4. 結果はAPIルーターで集約

### OBSオーバーレイ

- トークンベース認証（ユーザーJWTとは別）
- クエリパラメータベースのカスタマイズ（期間、ゲームモード、表示項目、レイアウト、テーマ）
- ライブ更新用の自動リフレッシュ機能
- プライバシー優先: ユーザー認証情報を公開せず専用トークンを使用

## データベーススキーマ

主要なリレーションシップ:
- `User` 1→N `Deck` (`user_id`経由)
- `User` 1→N `Duel` (`user_id`経由)
- `Duel` N→1 `Deck` (`deck_id`経由 - プレイヤーのデッキ)
- `Duel` N→1 `Deck` (`opponent_deck_id`経由 - 相手のデッキ)
- `Deck`は`is_opponent`ブール値でプレイヤー/相手デッキを区別

## Git運用フロー

**ブランチ戦略:**
- `main` - 本番環境対応コード（保護されており、PRが必要）
- `develop` - 開発用ブランチ（日常的な開発はここで行う）
- フィーチャーブランチ: `feature/説明`
- バグ修正: `fix/説明`
- ドキュメント: `docs/説明`

**Claude Code向け開発フロー（重要）:**
- **開発作業は必ず`develop`ブランチまたは`develop`から切ったブランチで行うこと**
- **`main`ブランチへの直接コミットは禁止**（マージのみ許可）
- 作業開始時: `git checkout develop` または `git checkout -b feature/xxx develop`
- 作業完了後: `develop`にマージ → 必要に応じて`main`にマージ
- 緊急のhotfix等、特例がある場合はユーザーに確認すること

**コミットメッセージ:**
[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)に従う:
- `feat(scope): 説明` - 新機能
- `fix(scope): 説明` - バグ修正
- `docs(scope): 説明` - ドキュメント
- `style(scope): 説明` - コードフォーマット
- `refactor(scope): 説明` - リファクタリング
- `test(scope): 説明` - テスト
- `chore(scope): 説明` - ビルド/ツール変更

**Pull Request:**
- チームメンバーのコードレビューが必要
- 全てのテストが通過する必要がある
- リンティングチェックが通過する必要がある

## 環境設定

### ローカル開発環境

ローカル開発時は `scripts/dev.sh` が自動的に環境変数を設定します。手動で設定する場合:

```bash
# バックエンド環境変数
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55322/postgres"
export SUPABASE_URL="http://127.0.0.1:55321"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
export SUPABASE_JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
export SECRET_KEY="hrD0GEww5vtDXQoj/UxNHBXtH+SjgXeOJUNbrIX/l+Y="
export ENVIRONMENT="development"
export FRONTEND_URL="http://localhost:5173"
```

### 本番環境設定

本番環境の設定は `.env.example` を参考に各環境の `.env` ファイルを作成:

**バックエンド必須環境変数:**
- `DATABASE_URL` - PostgreSQL接続文字列
- `SUPABASE_URL` - Supabase Project URL
- `SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_JWT_SECRET` - Supabase JWT Secret
- `SECRET_KEY` - OBSトークン用シークレットキー（base64形式で生成）
- `FRONTEND_URL` - フロントエンドURL

**フロントエンド:** `frontend/`内の複数のenvファイル
- `.env.development` - 開発環境設定
- `.env.production` - 本番環境設定
- `.env.test` - テスト環境設定

**SECRET_KEY生成方法（base64形式を使用）:**
```bash
openssl rand -base64 32
```

## デプロイ

- **フロントエンド:** Vercel
- **バックエンド:** Render (Docker)
- **データベース:** Supabase Cloud または Neon (PostgreSQL)
- **認証:** Supabase Auth
- **CI/CD:** GitHub Actions

詳細なデプロイ手順は`docs/deployment.md`を参照してください。

## ドキュメント

- `docs/development-guide.md` - コーディング規約とワークフロー
- `docs/deployment.md` - デプロイ手順
- `docs/api-reference.md` - APIエンドポイントドキュメント
- `docs/db-schema.md` - データベーススキーマ詳細
- `docs/error-handling.md` - エラーハンドリングパターン
