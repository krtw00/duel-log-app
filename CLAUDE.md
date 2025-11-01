# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Duel Log Appは、トレーディングカードゲーム（TCG）の対戦履歴を記録・分析するWebアプリケーションです。詳細な統計情報、デッキ管理、相性分析、配信者向けのOBSオーバーレイ機能を提供します。

**技術スタック:**
- **バックエンド:** Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **フロントエンド:** TypeScript, Vue 3 (Composition API), Vuetify 3, Pinia, Vite
- **テスト:** バックエンド: Pytest | フロントエンド: Vitest
- **リンター/フォーマッター:** バックエンド: Ruff, Black | フロントエンド: ESLint, Prettier

## よく使うコマンド

### Docker開発環境（推奨）

```bash
# 全サービスを起動
docker-compose up --build -d

# データベースマイグレーション実行
docker-compose exec backend alembic upgrade head

# 全サービスを停止
docker-compose down

# 全サービスを停止してデータも削除
docker-compose down -v
```

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
- JWTトークンをHttpOnly Cookieに保存
- 認証ロジックは`backend/app/auth.py`と`backend/app/core/security.py`
- bcryptによるパスワードハッシュ化

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
- フィーチャーブランチ: `feature/説明`
- バグ修正: `fix/説明`
- ドキュメント: `docs/説明`

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

**バックエンド:** `backend/.env`
```bash
DATABASE_URL=postgresql://user:password@db:5432/duel_log_db
SECRET_KEY=your_secret_key_here
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

**フロントエンド:** `frontend/`内の複数のenvファイル
- `.env.development` - 開発環境設定
- `.env.production` - 本番環境設定
- `.env.test` - テスト環境設定

SECRET_KEY生成方法:
```bash
openssl rand -hex 32
```

## デプロイ

- **フロントエンド:** Vercel
- **バックエンド:** Render
- **データベース:** Neon (PostgreSQL)
- **CI/CD:** GitHub Actions

詳細なデプロイ手順は`docs/deployment.md`を参照してください。

## ドキュメント

- `docs/development-guide.md` - コーディング規約とワークフロー
- `docs/deployment.md` - デプロイ手順
- `docs/api-reference.md` - APIエンドポイントドキュメント
- `docs/db-schema.md` - データベーススキーマ詳細
- `docs/error-handling.md` - エラーハンドリングパターン
