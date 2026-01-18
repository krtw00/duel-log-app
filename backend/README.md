# Duel Log App - Backend API

FastAPI + SQLAlchemy + PostgreSQL を使用したデュエルログアプリケーションのバックエンドAPIです。

## 🌐 本番環境

- **API URL**: https://duel-log-app.onrender.com
- **API ドキュメント (Swagger)**: https://duel-log-app.onrender.com/docs
- **API ドキュメント (ReDoc)**: https://duel-log-app.onrender.com/redoc
- **フロントエンド**: https://duel-log-app.vercel.app/

## ⚙️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **フレームワーク** | FastAPI 0.104+ |
| **言語** | Python 3.11 |
| **ORM** | SQLAlchemy 2.0+ |
| **バリデーション** | Pydantic v2 |
| **マイグレーション** | Alembic |
| **認証** | JWT (HttpOnly Cookies) |
| **パスワード** | bcrypt |
| **データベース** | PostgreSQL |

## 🏁 セットアップ

### 前提条件

- Python 3.11以上
- Supabase CLI（ローカル開発用）
- Docker（ローカルSupabase実行用）

### 推奨: 開発スクリプトを使用

プロジェクトルートから開発スクリプトを実行するのが最も簡単です：

```bash
# プロジェクトルートで実行
./scripts/dev.sh
```

このスクリプトは以下を自動的に実行します：
1. ローカルSupabaseの起動
2. Python仮想環境の作成
3. 依存関係のインストール
4. データベースマイグレーション
5. 開発サーバーの起動

### 手動セットアップ

#### 1. uvのインストール（未インストールの場合）

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# または pip で
pip install uv
```

#### 2. 依存関係のインストール

```bash
cd backend
uv sync
```

#### 3. ローカルSupabaseの起動

```bash
# プロジェクトルートで実行
supabase start
```

#### 4. 環境変数の設定

`backend/.env` ファイルを作成：

```env
# データベース接続URL（ローカルSupabase）
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55322/postgres

# Supabase設定
SUPABASE_URL=http://127.0.0.1:55321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# JWT設定
SECRET_KEY=your-secret-key-here-at-least-32-characters-long

# アプリケーション設定
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

**SECRET_KEYの生成**:

```bash
openssl rand -hex 32
```

#### 5. 開発サーバーの起動

```bash
# start.pyを使用（推奨）
uv run python start.py

# または直接uvicornを実行
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

サーバーが起動したら、以下のURLにアクセスできます：

- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Supabase Studio**: http://127.0.0.1:55323

## 📁 プロジェクト構造

```
backend/
├── alembic/                    # データベースマイグレーション
│   ├── versions/              # マイグレーションファイル
│   └── env.py                 # Alembic設定
├── app/
│   ├── api/                   # APIレイヤー
│   │   ├── deps.py           # 依存性注入
│   │   └── routers/          # エンドポイント
│   │       ├── auth.py       # 認証
│   │       ├── users.py      # ユーザー管理
│   │       ├── me.py         # 現在のユーザー
│   │       ├── decks.py      # デッキ管理
│   │       ├── duels.py      # デュエル記録
│   │       └── statistics.py # 統計情報
│   ├── core/                  # コア機能
│   │   ├── config.py         # 設定管理（Pydantic Settings）
│   │   ├── security.py       # JWT・bcrypt
│   │   ├── exceptions.py     # カスタム例外
│   │   ├── exception_handlers.py  # 例外ハンドラー
│   │   └── logging_config.py # ログ設定
│   ├── db/                    # データベース
│   │   └── session.py        # セッション管理
│   ├── models/                # SQLAlchemyモデル
│   │   ├── user.py
│   │   ├── deck.py
│   │   ├── duel.py
│   │   └── password_reset_token.py
│   ├── schemas/               # Pydanticスキーマ
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── deck.py
│   │   └── duel.py
│   ├── services/              # ビジネスロジック
│   │   ├── user_service.py
│   │   ├── deck_service.py
│   │   ├── duel_service.py
│   │   └── statistics_service.py
│   └── main.py                # エントリーポイント
├── tests/                     # テストコード
├── requirements.txt           # Python依存関係
└── start.py                   # 開発サーバー起動
```

## 🔌 API エンドポイント

### 認証 (`/auth`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/auth/login` | ログイン（HttpOnlyクッキーを設定） |
| POST | `/auth/logout` | ログアウト |
| POST | `/auth/forgot-password` | パスワードリセットリクエスト |
| POST | `/auth/reset-password` | パスワードリセット実行 |

### ユーザー (`/users`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/users/` | ユーザー登録 |
| GET | `/users/` | ユーザー一覧 |
| GET | `/users/{user_id}` | ユーザー詳細 |

### 現在のユーザー (`/me`) 🔒

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/me/` | 現在のユーザー情報取得 |
| PUT | `/me/` | プロフィール更新 |
| DELETE | `/me/` | アカウント削除 |

### デッキ (`/decks`) 🔒

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/decks/` | デッキ作成 |
| GET | `/decks/` | デッキ一覧 |
| GET | `/decks/{deck_id}` | デッキ詳細 |
| PUT | `/decks/{deck_id}` | デッキ更新 |
| DELETE | `/decks/{deck_id}` | デッキ削除 |

### デュエル (`/duels`) 🔒

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/duels/` | デュエル記録作成 |
| GET | `/duels/` | デュエル履歴取得 |
| GET | `/duels/{duel_id}` | デュエル詳細 |
| PUT | `/duels/{duel_id}` | デュエル記録更新 |
| DELETE | `/duels/{duel_id}` | デュエル記録削除 |

### 統計 (`/statistics`) 🔒

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/statistics/summary` | 統計サマリー |
| GET | `/statistics/deck-distribution` | デッキ分布 |
| GET | `/statistics/matchup-table` | デッキ相性表 |

🔒 = 認証が必要

## 🗄️ データベースマイグレーション

### マイグレーションの作成

```bash
# モデルの変更を検出して自動生成
alembic revision --autogenerate -m "説明"
```

### マイグレーションの適用

```bash
# 最新バージョンまで適用
alembic upgrade head

# 特定のバージョンまで適用
alembic upgrade <revision_id>
```

### ロールバック

```bash
# 1つ前に戻す
alembic downgrade -1

# 特定のバージョンに戻す
alembic downgrade <revision_id>
```

### 履歴の確認

```bash
alembic history
alembic current
```

## 🧪 テスト

### テストの実行

```bash
# すべてのテストを実行
pytest

# カバレッジ付き
pytest --cov=app --cov-report=html

# 特定のテストのみ
pytest tests/test_deck_api.py

# 詳細出力
pytest -v
```

カバレッジレポートは `htmlcov/index.html` に生成されます。

## 🛡️ 認証とセキュリティ

### JWT認証フロー

1. **ログイン**: `POST /auth/login`
   - メールアドレスとパスワードを送信
   - サーバーがJWTトークンを生成
   - **HttpOnlyクッキー**にトークンを設定

2. **認証が必要なエンドポイント**:
   - ブラウザが自動的にクッキーを送信
   - サーバーがトークンを検証
   - ユーザー情報を取得

3. **ログアウト**: `POST /auth/logout`
   - クッキーを削除

### セキュリティ機能

#### HttpOnlyクッキー
- JavaScriptからアクセス不可
- XSS攻撃からトークンを保護

#### SameSite属性
- 開発環境: `Lax`
- 本番環境: `None`（クロスオリジン対応）

#### Secure属性
- 本番環境: `True`（HTTPS必須）
- 開発環境: `False`

#### パスワードハッシュ化
- bcryptアルゴリズムを使用
- ソルトを自動生成

### CORS設定

クロスオリジンリクエストに対応：

```python
# 環境変数で設定
FRONTEND_URL=https://duel-log-app.vercel.app

# 動的パターンマッチング
- *.vercel.app      # Vercelプレビューデプロイ
- localhost:*       # ローカル開発
```

## 🚀 デプロイ

### Renderへのデプロイ

本番環境: https://duel-log-app.onrender.com

#### 1. PostgreSQLの作成

1. Render Dashboard → New → PostgreSQL
2. データベース名を入力
3. Internal Database URLをコピー

#### 2. Web Serviceの作成

1. Render Dashboard → New → Web Service
2. GitHubリポジトリを接続
3. 設定を入力：

| 項目 | 値 |
|-----|-----|
| Name | `duel-log-app` |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

#### 3. 環境変数の設定

| Key | Value | 説明 |
|-----|-------|------|
| `ENVIRONMENT` | `production` | **重要**: 本番環境モード |
| `DATABASE_URL` | (PostgreSQL URL) | データベース接続 |
| `SECRET_KEY` | (32文字以上) | JWT署名鍵 |
| `FRONTEND_URL` | `https://duel-log-app.vercel.app` | CORS許可 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | トークン有効期限 |
| `LOG_LEVEL` | `INFO` | ログレベル |

#### 4. 自動デプロイ

GitHubにプッシュすると自動的にデプロイされます。

```bash
git add .
git commit -m "Deploy to Render"
git push
```

## 🔧 トラブルシューティング

### CORSエラー

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解決方法**:
1. `FRONTEND_URL` が正しく設定されているか確認
2. `ENVIRONMENT=production` が設定されているか確認
3. Renderログで「Allowed CORS origins」を確認

📖 詳細: `CORS_FIX_QUICKSTART.md`

### ログイン後に401エラー

```
401 Unauthorized on /me
```

**解決方法**:
1. `ENVIRONMENT=production` を確認
2. Renderログで「Cookie settings - SameSite: none, Secure: True」を確認
3. ブラウザのクッキーを確認（F12 → Application → Cookies）

📖 詳細: `LOGIN_REDIRECT_FIX.md`

### データベース接続エラー

```
Could not connect to database
```

**解決方法**:
1. `DATABASE_URL` のフォーマットを確認
2. PostgreSQLサービスが起動しているか確認
3. ファイアウォール設定を確認

### マイグレーションエラー

```
Target database is not up to date
```

**解決方法**:
```bash
alembic upgrade head
```

## 📚 ドキュメント

### セットアップ・デプロイ
- `CORS_FIX_QUICKSTART.md` - CORS設定ガイド
- `RENDER_CORS_SETUP.md` - Render詳細設定
- `LOGIN_REDIRECT_FIX.md` - ログイン認証設定

### 機能実装
- `PASSWORD_RESET_IMPLEMENTATION.md` - パスワードリセット実装
- `CHECKLIST.md` - 機能チェックリスト
- `REFACTORING_SUMMARY.md` - リファクタリング履歴

### アーキテクチャ
- `../docs/ER図.md` - データベース設計
- `../docs/PROJECT_OVERVIEW.md` - プロジェクト概要
- `../docs/SECURITY_IMPROVEMENTS.md` - セキュリティ改善

## 📞 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/krtw00/duel-log-app/issues)で報告してください。

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
