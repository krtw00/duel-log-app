# ADR 001: FastAPIをバックエンドフレームワークとして採用

## ステータス

**採用済み** (2024-01)

## コンテキスト

Duel Log Appのバックエンドフレームワークを選定する必要がある。

### 要件

- RESTful APIの構築
- 非同期処理のサポート
- 型安全性
- 自動APIドキュメント生成
- Python 3.11+での動作

### 検討した選択肢

1. **FastAPI** - 高速で型安全なWebフレームワーク
2. **Django REST Framework** - フルスタックフレームワーク
3. **Flask** - 軽量Webフレームワーク
4. **Express.js (Node.js)** - JavaScript/TypeScript

## 決定

**FastAPI**を採用する。

## 理由

### FastAPIの利点

| 観点 | FastAPI |
|------|---------|
| **パフォーマンス** | Starlette/Uvicornベースで高速 |
| **型安全性** | Pydanticによる自動バリデーション |
| **ドキュメント** | OpenAPI自動生成（Swagger UI） |
| **非同期** | async/awaitネイティブサポート |
| **学習曲線** | Pythonの知識があれば習得容易 |

### 他の選択肢を選ばなかった理由

| フレームワーク | 見送り理由 |
|--------------|-----------|
| Django REST Framework | オーバーヘッドが大きい、シンプルなAPIには過剰 |
| Flask | 型安全性がない、ボイラープレートが多い |
| Express.js | チームのPythonスキルを活かせない |

## 結果

### メリット

- Pydanticモデルによる自動バリデーションでコード量削減
- Swagger UIで開発者・フロントエンドとの連携が容易
- 型ヒントによりIDEサポートが充実

### デメリット

- Django ORMのような強力なORMが同梱されていない（SQLAlchemyを別途採用）
- Djangoに比べてエコシステムが小さい

### 学び

- FastAPI + SQLAlchemy + Alembicの組み合わせは保守性が高い
- Pydanticモデルの設計が重要（入力/出力/DBモデルの分離）

## 関連ドキュメント

- @../02-architecture/backend-architecture.md
- @002-supabase-auth.md

## 参考リンク

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [Pydantic公式ドキュメント](https://docs.pydantic.dev/)
