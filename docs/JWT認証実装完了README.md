# JWT認証機能の実装完了

## 実装概要

Duel Log AppにJWT（JSON Web Token）を使用したセキュアなログイン機能を実装しました。

## 新規作成ファイル

### バックエンド

1. **`backend/app/core/security.py`**
   - パスワードのハッシュ化・検証
   - JWTトークンの生成・検証
   - bcryptによる安全なパスワード管理

2. **`backend/app/schemas/auth.py`**
   - ログインリクエストのスキーマ（`LoginRequest`）
   - トークンレスポンスのスキーマ（`TokenResponse`）
   - トークンデータのスキーマ（`TokenData`）

3. **`backend/app/api/routers/auth.py`**
   - `POST /auth/login`: ログインエンドポイント
   - メールアドレスとパスワードで認証
   - JWTアクセストークンを返す

4. **`backend/app/api/routers/me.py`**
   - `GET /me/`: 現在のユーザー情報取得
   - 認証が必要なエンドポイントの実装例

### ドキュメント

5. **`docs/JWT認証実装ガイド.md`**
   - 詳細な実装ガイド
   - フロントエンド実装例（Vue.js）
   - セキュリティの注意事項
   - トラブルシューティング

## 更新ファイル

1. **`backend/app/core/config.py`**
   - JWT設定の追加（SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES）
   - 環境変数の検証

2. **`backend/app/auth.py`**
   - `get_current_user()`: JWT検証と現在のユーザー取得
   - `get_current_user_optional()`: オプショナル認証

3. **`backend/app/main.py`**
   - 認証ルーターの追加

4. **`backend/app/services/user_service.py`**
   - パスワードハッシュ化をsecurity.pyに統一

5. **`backend/app/api/routers/users.py`**
   - 重複コードの削除

6. **`backend/requirements.txt`**
   - `python-jose[cryptography]==3.3.0`の追加

7. **`.env.example`**
   - JWT設定の環境変数例を追加

8. **`requests.http`**
   - 認証APIのテストリクエスト追加

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```bash
# データベース設定
DATABASE_URL=postgresql://user:password@localhost/duel_log_db

# JWT設定（必須）
SECRET_KEY=<ランダムな文字列>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**SECRET_KEYの生成:**
```bash
openssl rand -hex 32
```

### 3. サーバー起動

```bash
cd backend
uvicorn app.main:app --reload
```

## API使用例

### 1. ユーザー登録

```bash
POST http://localhost:8000/users/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123"
}
```

### 2. ログイン

```bash
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "securepassword123"
}
```

**レスポンス:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. 認証が必要なAPIへのアクセス

```bash
GET http://localhost:8000/me/
Authorization: Bearer <access_token>
```

## 認証フロー

```
1. ユーザーがメールアドレスとパスワードでログイン
   ↓
2. サーバーがパスワードを検証
   ↓
3. 検証成功時、JWTトークンを生成して返す
   ↓
4. クライアントがトークンをローカルストレージに保存
   ↓
5. 以降のAPIリクエストで Authorization ヘッダーにトークンを含める
   ↓
6. サーバーがトークンを検証してユーザーを特定
```

## セキュリティ機能

- ✅ パスワードのbcryptハッシュ化
- ✅ JWTによるステートレス認証
- ✅ トークンの有効期限管理
- ✅ 署名検証によるトークン改ざん防止
- ✅ 環境変数による秘密鍵管理

## フロントエンド実装のポイント

### トークンの保存
```javascript
// ログイン成功時
localStorage.setItem('access_token', data.access_token);
```

### 認証が必要なリクエスト
```javascript
// Authorizationヘッダーにトークンを含める
fetch('http://localhost:8000/me/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### ログアウト
```javascript
// トークンを削除
localStorage.removeItem('access_token');
```

詳細な実装例は `docs/JWT認証実装ガイド.md` を参照してください。

## エンドポイント一覧

### 認証
- `POST /auth/login` - ログイン

### 現在のユーザー
- `GET /me/` - 現在のユーザー情報取得（認証必須）

### ユーザー管理
- `POST /users/` - ユーザー登録
- `GET /users/{user_id}` - ユーザー取得
- `GET /users/` - ユーザー一覧
- `PUT /users/{user_id}` - ユーザー更新
- `DELETE /users/{user_id}` - ユーザー削除

## テスト方法

`requests.http`ファイルを使用してVS Code REST Clientでテスト可能です。

1. ユーザー登録
2. ログイン（トークン取得）
3. `/me/`エンドポイントでトークン検証

## 今後の拡張予定

- [ ] リフレッシュトークンの実装
- [ ] パスワードリセット機能
- [ ] 多要素認証（MFA）
- [ ] ソーシャルログイン（Google, GitHub）
- [ ] セッション管理機能

## トラブルシューティング

### SECRET_KEYエラー
```
RuntimeError: SECRET_KEY is not set in environment variables.
```
→ `.env`ファイルに`SECRET_KEY`を設定してください

### 401 Unauthorized
- トークンが無効または期限切れ
- 再度ログインしてください

### トークンが保存されない
- ブラウザのローカルストレージ設定を確認
- プライベートブラウジングモードでは動作しません

詳細は `docs/JWT認証実装ガイド.md` を参照してください。
