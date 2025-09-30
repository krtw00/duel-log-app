# Duel Log Backend - リファクタリングドキュメント

## 📋 リファクタリング概要

このリファクタリングでは、コードの保守性、可読性、拡張性を向上させました。

## 🎯 主な改善点

### 1. **基底サービスクラスの導入**
- `app/services/base/base_service.py`に共通のCRUD操作を集約
- コードの重複を削減し、一貫性を向上
- ジェネリクスを使用して型安全性を確保

**使用例:**
```python
class DeckService(BaseService[Deck, DeckCreate, DeckUpdate]):
    def __init__(self):
        super().__init__(Deck)
```

### 2. **例外処理の統一**
- カスタム例外クラスを`app/core/exceptions/`に作成
- グローバル例外ハンドラーを実装
- エラーメッセージの一貫性を確保

**例外クラス:**
- `NotFoundException`: リソースが見つからない (404)
- `UnauthorizedException`: 認証エラー (401)
- `ForbiddenException`: 権限エラー (403)
- `ValidationException`: バリデーションエラー (422)
- `ConflictException`: 競合エラー (409)

### 3. **ロギングの改善**
- 集中管理されたロギング設定 (`app/core/logging_config.py`)
- 環境変数でログレベルを制御可能
- 構造化されたログ出力

### 4. **依存性注入の整理**
- `app/api/deps.py`に共通の依存関係を集約
- 認証ロジックの一元化
- より明確な責任分担

### 5. **スキーマの改善**
- Pydantic v2の機能を活用
- フィールドバリデーションの強化
- より詳細なドキュメント

### 6. **設定管理の改善**
- `pydantic-settings`を使用した型安全な設定管理
- 環境変数の検証
- デフォルト値の明示

## 📁 ディレクトリ構造

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # 共通の依存性注入
│   │   └── routers/             # APIエンドポイント
│   │       ├── auth.py
│   │       ├── decks.py
│   │       ├── duels.py
│   │       ├── me.py
│   │       └── users.py
│   ├── core/
│   │   ├── config.py            # 設定管理
│   │   ├── security.py          # セキュリティ関連
│   │   ├── logging_config.py    # ログ設定
│   │   ├── exception_handlers.py # 例外ハンドラー
│   │   └── exceptions/          # カスタム例外
│   │       └── __init__.py
│   ├── db/
│   │   └── session.py           # データベースセッション
│   ├── models/                  # SQLAlchemyモデル
│   │   ├── deck.py
│   │   ├── duel.py
│   │   └── user.py
│   ├── schemas/                 # Pydanticスキーマ
│   │   ├── deck.py
│   │   ├── duel.py
│   │   └── user.py
│   ├── services/                # ビジネスロジック
│   │   ├── base/
│   │   │   ├── __init__.py
│   │   │   └── base_service.py  # 基底サービスクラス
│   │   ├── deck_service.py
│   │   ├── duel_service.py
│   │   └── user_service.py
│   ├── auth.py                  # 後方互換性用
│   └── main.py                  # アプリケーションエントリーポイント
├── alembic/                     # データベースマイグレーション
├── requirements.txt
└── README_REFACTORING.md        # このファイル
```

## 🔧 新機能

### 1. **フィルタリング機能**
デュエル一覧でフィルタリングが可能になりました：

```python
GET /duels?deck_id=1&start_date=2024-01-01&end_date=2024-12-31
```

### 2. **勝率統計**
デッキごとまたは全体の勝率を取得できます：

```python
GET /duels/stats/win-rate?deck_id=1
```

### 3. **ヘルスチェック**
アプリケーションの状態を確認できます：

```python
GET /health
```

## 🚀 使用方法

### 開発環境のセットアップ

1. **依存関係のインストール:**
```bash
pip install -r requirements.txt
```

2. **環境変数の設定:**
`.env`ファイルを作成：
```env
DATABASE_URL=postgresql://user:password@localhost/duel_log
SECRET_KEY=your-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
LOG_LEVEL=INFO
DEBUG=false
```

3. **データベースマイグレーション:**
```bash
alembic upgrade head
```

4. **アプリケーションの起動:**
```bash
uvicorn app.main:app --reload
```

## 📝 コーディング規約

### サービスクラスの作成

新しいエンティティのサービスを作成する場合：

```python
from app.services.base import BaseService
from app.models.your_model import YourModel
from app.schemas.your_schema import YourCreate, YourUpdate

class YourService(BaseService[YourModel, YourCreate, YourUpdate]):
    def __init__(self):
        super().__init__(YourModel)
    
    # カスタムメソッドを追加
    def custom_method(self, db: Session, ...):
        # 実装
        pass

# シングルトンインスタンス
your_service = YourService()
```

### ルーターの作成

```python
from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user, get_db
from app.services.your_service import your_service

router = APIRouter(prefix="/your-resource", tags=["your-resource"])

@router.get("/", response_model=List[YourRead])
def list_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return your_service.get_all(db=db, user_id=current_user.id)
```

### 例外の使用

```python
from app.core.exceptions import NotFoundException

def get_item(item_id: int):
    item = your_service.get_by_id(db, item_id)
    if not item:
        raise NotFoundException("アイテムが見つかりません")
    return item
```

## 🔄 マイグレーションガイド

### 既存コードの移行

#### Before (旧コード):
```python
# サービス
def get_decks(db: Session, user_id: int):
    return db.query(models.Deck).filter(models.Deck.user_id == user_id).all()

# ルーター
@router.get("/")
def list_decks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return deck_service.get_decks(db, user.id)
```

#### After (新コード):
```python
# サービス
class DeckService(BaseService[Deck, DeckCreate, DeckUpdate]):
    def get_user_decks(self, db: Session, user_id: int):
        return self.get_all(db=db, user_id=user_id)

# ルーター
@router.get("/", response_model=List[DeckRead])
def list_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return deck_service.get_user_decks(db=db, user_id=current_user.id)
```

## 🧪 テスト

テストの作成例：

```python
import pytest
from app.services.deck_service import deck_service
from app.schemas.deck import DeckCreate

def test_create_deck(db_session, test_user):
    deck_in = DeckCreate(name="Test Deck", is_opponent=False)
    deck = deck_service.create(db_session, deck_in, user_id=test_user.id)
    
    assert deck.name == "Test Deck"
    assert deck.user_id == test_user.id
    assert deck.is_opponent == False
```

## 📊 パフォーマンス最適化

### 1. **データベースクエリの最適化**
- N+1問題の回避
- 適切なインデックスの使用
- クエリのバッチ処理

### 2. **キャッシング**
将来的な実装案：
- Redis によるセッションキャッシュ
- 頻繁にアクセスされるデータのキャッシング

## 🔐 セキュリティ

### 実装済みのセキュリティ機能

1. **JWT認証**
   - トークンベースの認証
   - 有効期限の管理

2. **パスワードハッシング**
   - bcryptを使用した安全なハッシュ化

3. **入力検証**
   - Pydanticによる厳密な型チェック
   - カスタムバリデーター

4. **SQLインジェクション対策**
   - SQLAlchemy ORMの使用
   - パラメータ化されたクエリ

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. **ImportError: pydantic-settings**
```bash
pip install pydantic-settings==2.0.3
```

#### 2. **DATABASE_URL が見つからない**
`.env`ファイルが正しく配置されているか確認：
```bash
# backend/.env が存在することを確認
ls -la backend/.env
```

#### 3. **マイグレーションエラー**
```bash
# マイグレーションの状態を確認
alembic current

# 必要に応じてリセット
alembic downgrade base
alembic upgrade head
```

## 📈 今後の改善計画

### 短期的な改善
- [ ] ユニットテストの追加
- [ ] 統合テストの実装
- [ ] APIドキュメントの充実

### 中期的な改善
- [ ] キャッシング機能の追加
- [ ] ページネーションの実装
- [ ] 検索機能の強化

### 長期的な改善
- [ ] GraphQL APIの検討
- [ ] WebSocket対応
- [ ] マイクロサービス化の検討

## 🤝 コントリビューション

コードの改善提案は歓迎します。以下のガイドラインに従ってください：

1. コードスタイルはBlackとFlake8に準拠
2. 型ヒントを必ず追加
3. ドキュメント文字列を記述
4. テストを追加

## 📚 参考資料

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [SQLAlchemy公式ドキュメント](https://docs.sqlalchemy.org/)
- [Pydantic公式ドキュメント](https://docs.pydantic.dev/)

## 📝 変更履歴

### v1.0.0 (2025-01-XX)
- 基底サービスクラスの実装
- 例外処理の統一
- ロギング機能の改善
- 設定管理の改善
- スキーマのバリデーション強化
- 新しいエンドポイントの追加（勝率統計、ヘルスチェック）

---

**注意:** このリファクタリングは後方互換性を保ちながら実装されています。既存のコードは引き続き動作しますが、新しいベストプラクティスに従って段階的に移行することを推奨します。
