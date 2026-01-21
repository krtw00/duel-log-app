# バックエンドアーキテクチャ

FastAPIベースのPythonバックエンド。

## 技術スタック

| 技術 | 用途 |
|------|------|
| Python 3.11+ | 言語 |
| FastAPI | Webフレームワーク |
| SQLAlchemy 2.0 | ORM |
| Pydantic v2 | バリデーション |
| Alembic | マイグレーション |
| Pytest | テスト |

---

## ディレクトリ構造

| ディレクトリ | 役割 |
|-------------|------|
| `app/api/routers/` | HTTPエンドポイント |
| `app/api/deps.py` | 依存性注入（DBセッション、認証） |
| `app/services/` | ビジネスロジック |
| `app/models/` | SQLAlchemyモデル |
| `app/schemas/` | Pydanticスキーマ |
| `app/core/` | 設定、セキュリティ |
| `alembic/` | マイグレーション |

---

## レイヤー構成

| レイヤー | 責務 | 場所 |
|---------|------|------|
| API (Routers) | HTTPリクエスト処理、バリデーション | `app/api/routers/` |
| Service | ビジネスロジック | `app/services/` |
| Model | データベース構造定義 | `app/models/` |
| Schema | API入出力定義 | `app/schemas/` |

---

## 認証

| 方式 | 説明 |
|------|------|
| Authorization ヘッダー | `Bearer <token>` 形式（推奨） |
| Cookie | `access_token` クッキー（フォールバック） |
| OBSトークン | `scope=obs_overlay` の専用トークン |

認証フロー:
1. Supabase Authでログイン
2. JWTトークンをES256/HS256で検証
3. ユーザーがDBに存在しない場合はJIT Provisioning

---

## 設定管理

| 設定 | 説明 |
|------|------|
| `app/core/config.py` | Pydantic BaseSettingsで環境変数を読み込み |
| `.env` | ローカル開発用の環境変数 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../04-data/data-model.md | データベーススキーマ |
| @../03-core-concepts/error-handling.md | エラーハンドリング |
| @../06-interfaces/api-reference.md | API仕様 |
