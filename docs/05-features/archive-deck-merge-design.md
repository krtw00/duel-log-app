# デッキアーカイブのマージ機能 設計

このドキュメントは、デッキのアーカイブ機能を改善し、同じ名前のデッキが複数アーカイブされることを防ぐためのマージ機能に関する設計を定義します。

## 実装状況

| 機能 | 実装状況 | 備考 |
|------|---------|------|
| 自動マージ（デッキ削除時） | ✅ 実装済み | `deck_service.delete()`で実装 |
| プレイヤーデッキの履歴移行 | ✅ 実装済み | `deck_id`の更新 |
| 相手デッキの履歴移行 | ✅ 実装済み | `opponent_deck_id`の更新 |
| 統合元デッキの物理削除 | ✅ 実装済み | マージ後に削除 |
| 管理者向け一括マージ | ✅ 実装済み | `/admin/merge-archived-decks` |
| フロントエンド統合 | ✅ 実装済み | MaintenanceSection.vue |

**実装済みファイル:**
- `backend/app/services/deck_service.py` - `delete()`メソッドにマージロジック実装
- `backend/app/api/routers/admin.py` - `POST /admin/merge-archived-decks`エンドポイント
- `frontend/src/components/admin/MaintenanceSection.vue` - 管理者向けマージUI

---

## 1. 概要

ユーザーがデッキをアーカイブする際、すでに同じ名前のデッキがアーカイブされている場合、新規にアーカイブするのではなく、既存のアーカイブ済みデッキに対戦履歴（デュエル情報）を統合（マージ）します。これにより、アーカイブリストの重複をなくし、データの整合性を高めます。

## 2. 背景と目的

現状では、同じ名前のデッキ（例：「ブルーアイズ」）を異なる時期に作成・使用し、それぞれをアーカイブすると、アーカイブリストに複数の「ブルーアイズ」が表示されてしまいます。これはユーザーにとって混乱を招き、過去の戦績分析を困難にします。

この機能を導入することで、以下の目的を達成します。
- **データの一元管理**: 同じデッキの戦績を一つのアーカイブ済みデッキに集約します。
- **UXの向上**: アーカイブリストを整理し、ユーザーが目的のデッキを見つけやすくします。
- **統計の正確性向上**: デッキごとの正確な累計戦績を保持できるようにします。

## 3. 設計方針

### 3.1. APIエンドポイント

デッキの削除を担当する `DELETE /decks/{deck_id}` エンドポイント（論理削除）のロジックを拡張して対応します。
このエンドポイントは内部的に `active: false` を設定する論理削除を実行します。

- **エンドポイント**: `DELETE /decks/{deck_id}`
- **実装場所**: `backend/app/services/deck_service.py` の `delete()` メソッド

### 3.2. ビジネスロジック (Serviceレイヤー)

`deck_service.py` の `delete()` メソッドに以下のロジックを実装します。

1.  **アーカイブ対象デッキの取得**:
    - リクエストされたデッキ（`Deck A`）を取得します。
    - 既にアーカイブ済み（`active: false`）の場合は処理を中断します。

2.  **既存アーカイブデッキの検索**:
    - `Deck A` と同じ `name` および `is_opponent` を持ち、かつ `active: false` のデッキ（`Deck B`）がデータベースに存在するかを検索します。
    - 検索対象は、同じ `user_id` に属するデッキに限定します。
    - `include_inactive=True` を指定して、アーカイブ済みデッキも検索対象に含めます。

3.  **ロジックの分岐**:

    -   **もし `Deck B` が存在する場合 (マージ処理)**:
        1.  **デュエル情報の移行（プレイヤーデッキとして）**: `Deck A` に紐づいている全ての `duels` レコードの `deck_id` を `Deck B` の `id` に更新します。
        2.  **デュエル情報の移行（相手デッキとして）**: `Deck A` が対戦相手のデッキとして使用されている `duels` レコードの `opponent_deck_id` を `Deck B` の `id` に更新します。
        3.  **重複デッキの物理削除**: デュエル情報の移行が完了した後、`Deck A` をデータベースから物理削除（`db.delete()`）します。
        4.  **コミット**: トランザクションをコミットします。

    -   **もし `Deck B` が存在しない場合 (通常のアーカイブ処理)**:
        1.  従来通り、`Deck A` の `active` フラグを `false` に設定して更新します。
        2.  コミットして処理を完了します。

4.  **戻り値**:
    - 処理が成功した場合は `True` を返却します。
    - デッキが存在しない、または既にアーカイブ済みの場合は `False` を返却します。

### 3.3. データベース操作

- **UPDATE**: `duels` テーブルにて、`deck_id` または `opponent_deck_id` が `Deck A` のIDと一致するレコードを、`Deck B` のIDに更新します。
- **DELETE**: `decks` テーブルから `Deck A` のレコードを物理削除します。

**注意**: フィールド名は `opponent_deck_id`（スネークケース）を使用します。`opponentDeck_id` ではありません。

これらの操作は、アトミック性を保証するため、単一のデータベーストランザクション内で実行する必要があります。

## 4. 影響範囲

- **`backend/app/services/deck_service.py`**:
  - メインのビジネスロジックを実装します。
- **`backend/app/api/routers/decks.py`**:
  - サービスレイヤーの呼び出し部分は変更不要ですが、レスポンスの挙動が変わることを認識する必要があります。
- **`backend/app/models/duel.py`**:
  - `deck_id` と `opponentDeck_id` のリレーションシップを利用して更新クエリを構築します。

## 5. データベーススキーマへの影響

なし。既存のテーブル構造やカラムに変更は加えません。

## 6. API仕様の変更

`DELETE /decks/{deck_id}` の挙動が以下のように変更されます。

- **リクエスト**: 変更なし。
- **レスポンス**:
  - 現在の実装では、成功時に `204 No Content` を返却しているため、レスポンスボディはありません。
  - マージが発生した場合も、通常のアーカイブの場合も、同じレスポンスが返却されます。
  - フロントエンドは、削除されたデッキが実際には統合されている可能性があることを認識する必要がありますが、現在のUI設計では特に問題はありません。

### フロントエンドへの影響

- デッキ削除後、デッキリストを再取得することで、統合後の状態が正しく反映されます。
- ユーザーには、通常のアーカイブと同じように見えますが、内部では重複が自動的に統合されています。

## 7. 実装例

### バックエンド実装 (`deck_service.py`)

```python
def delete(self, db: Session, id: int, user_id: Optional[int] = None) -> bool:
    """デッキを論理削除（active=False）に変更。既存のアーカイブと統合。"""
    # アーカイブ対象のデッキを取得
    deck = self.get_by_id(db=db, id=id, user_id=user_id, include_inactive=True)

    if deck is None or deck.active is False:
        return False

    # 同名のアーカイブ済みデッキを探す
    existing_archive = self.get_by_name(
        db=db,
        user_id=user_id,
        name=deck.name,
        is_opponent=deck.is_opponent,
        include_inactive=True
    )

    # active=Falseのアーカイブが既に存在する場合
    if existing_archive and existing_archive.id != deck.id and not existing_archive.active:
        # 対戦履歴を既存のアーカイブに移行
        db.query(Duel).filter(Duel.deck_id == deck.id).update({"deck_id": existing_archive.id})
        db.query(Duel).filter(Duel.opponent_deck_id == deck.id).update({"opponent_deck_id": existing_archive.id})

        # 統合元のデッキを物理削除
        db.delete(deck)
    else:
        # 通常のアーカイブ
        deck.active = False

    db.commit()
    return True
```

### テストケース

```python
def test_delete_deck_merges_with_existing_archive(db_session, test_user):
    """同名のアーカイブ済みデッキと統合されることを確認"""
    deck_service = DeckService()

    # 1. 既にアーカイブ済みのデッキを作成
    archived_deck = deck_service.create_user_deck(
        db=db_session,
        user_id=test_user.id,
        deck_in=DeckCreate(name="ブルーアイズ", is_opponent=False, active=True)
    )
    archived_deck.active = False
    db_session.commit()

    # 2. 同名のアクティブなデッキを作成
    active_deck = deck_service.create_user_deck(
        db=db_session,
        user_id=test_user.id,
        deck_in=DeckCreate(name="ブルーアイズ", is_opponent=False, active=True)
    )

    # 3. アクティブなデッキをアーカイブ（削除）
    result = deck_service.delete(db=db_session, id=active_deck.id, user_id=test_user.id)

    # 4. 検証
    assert result is True

    # アクティブなデッキは削除されている
    deleted_deck = db_session.query(Deck).filter(Deck.id == active_deck.id).first()
    assert deleted_deck is None

    # アーカイブ済みデッキは残っている
    remaining_deck = db_session.query(Deck).filter(Deck.id == archived_deck.id).first()
    assert remaining_deck is not None
    assert remaining_deck.active is False
```

## 8. 注意事項とベストプラクティス

### データ整合性の保証

- すべての操作は単一のトランザクション内で実行
- エラー時は自動的にロールバック
- 外部キー制約により、孤立したデュエルレコードは発生しない

### パフォーマンスへの配慮

- `get_by_name()` はインデックスを使用した高速検索
- 大量のデュエルレコードがある場合でも、一括更新により効率的に処理
- トランザクションは可能な限り短く保つ

### ユーザー体験

- ユーザーには自動統合の詳細を意識させない
- アーカイブ操作は従来通りシンプルに実行できる
- 統計情報は自動的に正しく集約される
