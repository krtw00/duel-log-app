# APIリファレンス

このドキュメントは、Duel Log AppのバックエンドAPIについて記述します。

ベースURL: `https://duel-log-app.onrender.com`

---

## 認証 (Authentication)

`prefix: /auth`

### `POST /login`

ユーザーをログインさせ、認証トークンをHttpOnlyクッキーに設定します。

- **リクエストボディ:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **レスポンス (200 OK):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "username": "string",
      "email": "user@example.com",
      "streamer_mode": false
    }
  }
  ```

### `POST /logout`

ユーザーをログアウトさせ、認証クッキーを削除します。

- **レスポンス (200 OK):**
  ```json
  {
    "message": "Logout successful"
  }
  ```

### `POST /forgot-password`

パスワードリセットを要求し、再設定用のメールを送信します（メール送信機能は未実装）。

- **リクエストボディ:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **レスポンス (200 OK):**
  ```json
  {
    "message": "パスワード再設定の案内をメールで送信しました。"
  }
  ```

### `POST /reset-password`

提供されたトークンを使用してパスワードをリセットします。

- **リクエストボディ:**
  ```json
  {
    "token": "string",
    "new_password": "string",
    "confirm_password": "string"
  }
  ```
- **レスポンス (200 OK):**
  ```json
  {
    "message": "パスワードが正常にリセットされました。"
  }
  ```

---

## ユーザー (Users)

`prefix: /users`

### `POST /`

新規ユーザーを作成します。

- **リクエストボディ:** `UserCreate` スキーマ
- **レスポンス (201 Created):** `UserResponse` スキーマ

### `GET /`

ユーザーの一覧を取得します（管理者向け）。

- **レスポンス (200 OK):** `List[UserResponse]`

### `GET /{user_id}`

指定されたIDのユーザー情報を取得します（管理者向け）。

- **レスポンス (200 OK):** `UserResponse`

---

## 現在のユーザー (Current User)

`prefix: /me`

### `GET /`

現在ログインしているユーザーのプロフィール情報を取得します。

- **レスポンス (200 OK):** `UserResponse`

### `PUT /`

現在のユーザーのプロフィール情報を更新します。

- **リクエストボディ:** `UserUpdate` スキーマ
- **レスポンス (200 OK):** `UserResponse`

### `DELETE /`

現在ログインしているユーザーのアカウントを削除します。

- **レスポンス (200 OK):** `{"message": "アカウントが正常に削除されました"}`

---

## デッキ (Decks)

`prefix: /decks`

### `GET /`

ユーザーのデッキ一覧を取得します。

- **クエリパラメータ:**
  - `is_opponent` (bool, optional): 対戦相手のデッキのみ取得するか
  - `active_only` (bool, optional): アクティブなデッキのみ取得するか
- **レスポンス (200 OK):** `List[DeckRead]`

### `POST /`

新しいデッキを作成します。

- **リクエストボディ:** `DeckCreate` スキーマ
- **レスポンス (201 Created):** `DeckRead`

### `GET /{deck_id}`

指定されたIDのデッキ情報を取得します。

- **レスポンス (200 OK):** `DeckRead`

### `PUT /{deck_id}`

指定されたIDのデッキ情報を更新します。

- **リクエストボディ:** `DeckUpdate` スキーマ
- **レスポンス (200 OK):** `DeckRead`

### `DELETE /{deck_id}`

指定されたIDのデッキを削除します。

- **レスポンス (204 No Content):**

### `POST /archive-all`

ユーザーのすべてのデッキをアーカイブ（非アクティブ化）します。

- **レスポンス (200 OK):** `{"message": "{count}件のデッキをアーカイブしました", "archived_count": count}`

---

## 対戦履歴 (Duels)

`prefix: /duels`

### `GET /`

ユーザーの対戦履歴一覧を取得します。

- **クエリパラメータ:**
  - `year` (int, optional): 年でフィルタリング
  - `month` (int, optional): 月でフィルタリング
- **レスポンス (200 OK):** `List[DuelRead]`

### `POST /`

新しい対戦履歴を作成します。

- **リクエストボディ:** `DuelCreate` スキーマ
- **レスポンス (201 Created):** `DuelRead`

### `POST /import/csv`

CSVファイルから対戦履歴を一括でインポートします。

- **リクエストボディ:** `UploadFile` (CSVファイル)
- **レスポンス (201 Created):** `{"message": "CSV file imported successfully"}`

### `GET /export/csv`

対戦履歴をCSV形式でエクスポートします。

- **レスポンス (200 OK):** CSVファイル

### `GET /{duel_id}`

指定されたIDの対戦履歴を取得します。

- **レスポンス (200 OK):** `DuelRead`

### `PUT /{duel_id}`

指定されたIDの対戦履歴を更新します。

- **リクエストボディ:** `DuelUpdate` スキーマ
- **レスポンス (200 OK):** `DuelRead`

### `DELETE /{duel_id}`

指定されたIDの対戦履歴を削除します。

- **レスポンス (204 No Content):**

### `GET /latest-values/`

各ゲームモードの最新のランク、レート、DC値を取得します。

- **レスポンス (200 OK):** `{"RANK": value, "RATE": value, "DC": value}`

---

## 共有統計 (Shared Statistics)

`prefix: /shared-statistics`

### `POST /`

ユーザーの統計情報への共有リンクを生成します。

- **リクエストボディ:** `SharedStatisticsCreate` スキーマ
  ```json
  {
    "year": 2023,
    "month": 10,
    "game_mode": "RANK",
    "expires_at": "2023-12-31T23:59:59Z"
  }
  ```
- **レスポンス (201 Created):** `SharedStatisticsRead` スキーマ
  ```json
  {
    "id": 1,
    "share_id": "unique_share_id_string",
    "user_id": 1,
    "year": 2023,
    "month": 10,
    "game_mode": "RANK",
    "created_at": "2023-10-26T10:00:00Z",
    "expires_at": "2023-12-31T23:59:59Z"
  }
  ```

### `GET /{share_id}`

共有IDを使用して統計情報を取得します。

- **パスパラメータ:**
  - `share_id` (string): 共有ID
- **クエリパラメータ:**
  - `year` (int, optional): 統計データを取得する年 (デフォルトは共有リンク作成時の年)
  - `month` (int, optional): 統計データを取得する月 (デフォルトは共有リンク作成時の月)
- **レスポンス (200 OK):** `Dict[str, Any]` (統計データを含むJSONオブジェクト)

### `DELETE /{share_id}`

共有リンクを削除します。

- **パスパラメータ:**
  - `share_id` (string): 共有ID
- **レスポンス (204 No Content):**

---

## 統計 (Statistics)

`prefix: /statistics`

### `GET /deck-distribution/monthly`

月間の相手デッキ分布を取得します。

- **クエリパラメータ:**
  - `year` (int, optional)
  - `month` (int, optional)
  - `game_mode` (str, optional)
- **レスポンス (200 OK):** `List[Dict[str, Any]]`

### `GET /deck-distribution/recent`

直近の相手デッキ分布を取得します。

- **クエリパラメータ:**
  - `limit` (int, optional): デフォルト30
  - `game_mode` (str, optional)
- **レスポンス (200 OK):** `List[Dict[str, Any]]`

### `GET /matchup-chart`

デッキ相性表のデータを取得します。

- **クエリパラメータ:**
  - `year` (int, optional)
  - `month` (int, optional)
  - `game_mode` (str, optional)
- **レスポンス (200 OK):** `List[Dict[str, Any]]`

### `GET /time-series/{game_mode}`

指定されたゲームモード（RATEまたはDC）の月間時系列データを取得します。

- **クエリパラメータ:**
  - `year` (int, optional)
  - `month` (int, optional)
- **レスポンス (200 OK):** `List[Dict[str, Any]]`
