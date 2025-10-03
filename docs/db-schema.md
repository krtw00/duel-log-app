# データベーススキーマ定義

このドキュメントは、Duel Log Appのデータベーススキーマについて記述します。

---

## テーブル一覧

- `users`: ユーザー情報を格納するテーブル
- `decks`: デッキ情報を格納するテーブル
- `duels`: 対戦履歴を格納するテーブル
- `password_reset_tokens`: パスワードリセットトークンを格納するテーブル
- `sharedurls`: 共有URLを格納するテーブル

---

## テーブル定義

### `users` テーブル

ユーザーアカウント情報を管理します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key** | ユーザーID |
| `username` | `String` | **Unique**, **Not Null** | ユーザー名 |
| `email` | `String` | **Unique**, **Not Null** | メールアドレス |
| `passwordhash` | `String` | **Not Null** | ハッシュ化されたパスワード |
| `createdat` | `DateTime(timezone=True)` | **Not Null**, Default: `now()` | 作成日時 (UTC) |
| `updatedat` | `DateTime(timezone=True)` | **Not Null**, Default: `now()`, On Update: `now()` | 更新日時 (UTC) |

### `decks` テーブル

ユーザーが登録したデッキ情報を管理します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key** | デッキID |
| `user_id` | `Integer` | **Foreign Key (users.id)**, **Not Null** | ユーザーID |
| `name` | `String` | **Not Null** | デッキ名 |
| `is_opponent` | `Boolean` | **Not Null**, Default: `False` | 対戦相手のデッキかどうか |
| `active` | `Boolean` | **Not Null**, Default: `True` | アクティブなデッキかどうか |
| `createdat` | `DateTime` | Default: `utcnow()` | 作成日時 |
| `updatedat` | `DateTime` | Default: `utcnow()`, On Update: `utcnow()` | 更新日時 |

### `duels` テーブル

対戦の履歴を管理します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key** | 対戦ID |
| `user_id` | `Integer` | **Foreign Key (users.id)**, **Not Null** | ユーザーID |
| `deck_id` | `Integer` | **Foreign Key (decks.id)**, **Not Null** | 使用したデッキのID |
| `opponentDeck_id` | `Integer` | **Not Null** | 対戦相手のデッキID |
| `result` | `Boolean` | **Not Null** | 結果 (True: 勝利, False: 敗北) |
| `game_mode` | `String(10)` | **Not Null**, Default: `'RANK'` | ゲームモード (RANK, RATE, EVENT, DC) |
| `rank` | `Integer` | Nullable | ランクモード時のランク |
| `rate_value` | `Integer` | Nullable | レートモード時のレート値 |
| `dc_value` | `Integer` | Nullable | DCモード時のDC値 |
| `coin` | `Boolean` | **Not Null** | コイントスの結果 (True: 表) |
| `first_or_second` | `Boolean` | **Not Null** | 先攻か後攻か (True: 先攻) |
| `played_date` | `DateTime(timezone=True)` | **Not Null** | 対戦した日時 (UTC) |
| `notes` | `String` | Nullable | メモ |
| `create_date` | `DateTime(timezone=True)` | Default: `now(utc)` | 作成日時 (UTC) |
| `update_date` | `DateTime(timezone=True)` | Default: `now(utc)`, On Update: `now(utc)` | 更新日時 (UTC) |

### `password_reset_tokens` テーブル

パスワードリセット用のトークンを管理します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key** | トークンID |
| `user_id` | `Integer` | **Foreign Key (users.id)**, **Not Null** | ユーザーID |
| `token` | `String` | **Unique**, **Not Null** | リセットトークン |
| `expires_at` | `DateTime(timezone=True)` | **Not Null** | トークンの有効期限 (UTC) |
| `created_at` | `DateTime(timezone=True)` | **Not Null**, Default: `now()` | 作成日時 (UTC) |

### `sharedurls` テーブル

戦績共有用のURLを管理します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | **Primary Key** | 共有ID |
| `user_id` | `Integer` | **Foreign Key (users.id)**, **Not Null** | ユーザーID |
| `year_month` | `String` | **Not Null** | 対象年月 (YYYY-MM) |
| `url` | `String` | **Unique**, **Not Null**, Default: `uuid4()` | 共有URLのユニークな文字列 |
| `createdat` | `DateTime` | Default: `utcnow()` | 作成日時 |
| `updatedat` | `DateTime` | Default: `utcnow()`, On Update: `utcnow()` | 更新日時 |
