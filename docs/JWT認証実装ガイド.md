# JWT認証機能の実装ドキュメント

## 概要

このドキュメントでは、Duel Log AppにJWT（JSON Web Token）認証を実装した内容を説明します。

## バックエンド実装

### 1. 新規作成されたファイル

#### `app/core/security.py`
パスワードのハッシュ化とJWTトークンの生成・検証を行うユーティリティ関数を提供します。

**主要な関数:**
- `verify_password()`: パスワード検証
- `get_password_hash()`: パスワードハッシュ化
- `create_access_token()`: JWTトークン生成
- `decode_access_token()`: JWTトークン検証

#### `app/schemas/auth.py`
認証関連のPydanticスキーマを定義します。

**スキーマ:**
- `LoginRequest`: ログインリクエスト（email, password）
- `TokenResponse`: トークンレスポンス（access_token, token_type）
- `TokenData`: トークンのペイロードデータ

#### `app/api/routers/auth.py`
認証APIエンドポイントを提供します。

**エンドポイント:**
- `POST /auth/login`: ログイン（JWTトークンを返す）

#### `app/api/routers/me.py`
現在のユーザー情報を取得する認証が必要なエンドポイントの例です。

**エンドポイント:**
- `GET /me/`: 現在のユーザー情報を取得（認証必須）

### 2. 更新されたファイル

#### `app/core/config.py`
JWT設定を追加しました。

```python
SECRET_KEY: str  # JWT署名用の秘密鍵
ALGORITHM: str   # 署名アルゴリズム（デフォルト: HS256）
ACCESS_TOKEN_EXPIRE_MINUTES: int  # トークン有効期限（分）
```

#### `app/auth.py`
仮実装から本格的なJWT認証実装に変更しました。

**主要な関数:**
- `get_current_user()`: 現在のユーザーを取得（認証必須）
- `get_current_user_optional()`: 現在のユーザーを取得（認証オプショナル）

#### `app/main.py`
認証ルーターを追加しました。

#### `requirements.txt`
`python-jose[cryptography]`を追加しました。

### 3. 環境変数

`.env`ファイルに以下の設定を追加してください:

```bash
# JWT Configuration
SECRET_KEY=your-secret-key-here-replace-with-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**SECRET_KEYの生成方法:**
```bash
openssl rand -hex 32
```

## フロントエンド実装ガイド

### 1. ログイン処理

```javascript
// ログインAPIを呼び出す
async function login(email, password) {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'ログインに失敗しました');
  }

  const data = await response.json();
  // トークンをローカルストレージに保存
  localStorage.setItem('access_token', data.access_token);
  
  return data;
}
```

### 2. 認証が必要なAPIリクエスト

```javascript
// 認証が必要なAPIリクエストを行う
async function fetchProtectedData() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('ログインが必要です');
  }

  const response = await fetch('http://localhost:8000/me/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // トークンが無効または期限切れ
    localStorage.removeItem('access_token');
    throw new Error('セッションが期限切れです。再度ログインしてください。');
  }

  if (!response.ok) {
    throw new Error('データの取得に失敗しました');
  }

  return await response.json();
}
```

### 3. ログアウト処理

```javascript
// ログアウト（トークンを削除）
function logout() {
  localStorage.removeItem('access_token');
  // ログインページへリダイレクト
  window.location.href = '/login';
}
```

### 4. Vue.js用の認証サービス例

```javascript
// src/services/authService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const authService = {
  // ログイン
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'ログインに失敗しました');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  },

  // ログアウト
  logout() {
    localStorage.removeItem('access_token');
  },

  // トークンの取得
  getToken() {
    return localStorage.getItem('access_token');
  },

  // ログイン状態の確認
  isAuthenticated() {
    return !!this.getToken();
  },

  // 現在のユーザー情報を取得
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      throw new Error('ログインが必要です');
    }

    const response = await fetch(`${API_BASE_URL}/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    return await response.json();
  },
};
```

### 5. Vue.js用のAPIクライアント例

```javascript
// src/services/apiClient.js
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = {
  // 共通のfetch処理
  async request(endpoint, options = {}) {
    const token = authService.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // トークンがあれば追加
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 401エラーの場合、ログアウト
    if (response.status === 401) {
      authService.logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'リクエストに失敗しました');
    }

    return await response.json();
  },

  // GET リクエスト
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST リクエスト
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT リクエスト
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE リクエスト
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

### 6. Vue.js Composition API用の認証フック例

```javascript
// src/composables/useAuth.js
import { ref, computed } from 'vue';
import { authService } from '../services/authService';

const user = ref(null);
const loading = ref(false);
const error = ref(null);

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  // ログイン
  async function login(email, password) {
    loading.value = true;
    error.value = null;
    
    try {
      await authService.login(email, password);
      // ユーザー情報を取得
      user.value = await authService.getCurrentUser();
      return true;
    } catch (e) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ログアウト
  function logout() {
    authService.logout();
    user.value = null;
  }

  // 初期化（ページ読み込み時にユーザー情報を復元）
  async function initialize() {
    if (!authService.isAuthenticated()) {
      return;
    }

    loading.value = true;
    try {
      user.value = await authService.getCurrentUser();
    } catch (e) {
      // トークンが無効な場合はログアウト
      authService.logout();
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    initialize,
  };
}
```

## 使用例

### API テスト（curl）

```bash
# 1. ユーザー作成
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123"
  }'

# 2. ログイン
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'

# レスポンス例:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer"
# }

# 3. 認証が必要なエンドポイントにアクセス
curl -X GET "http://localhost:8000/me/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Vue.jsコンポーネント例

```vue
<!-- src/views/Login.vue -->
<template>
  <div class="login-page">
    <h1>ログイン</h1>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="example@example.com"
        />
      </div>

      <div class="form-group">
        <label for="password">パスワード</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="パスワード"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'ログイン中...' : 'ログイン' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login, error, loading } = useAuth();

const email = ref('');
const password = ref('');

async function handleLogin() {
  const success = await login(email.value, password.value);
  
  if (success) {
    // ログイン成功後、ホームページへリダイレクト
    router.push('/');
  }
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error-message {
  color: red;
  margin-bottom: 15px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
```

## セキュリティに関する注意事項

1. **SECRET_KEYの管理**
   - 本番環境では絶対に強力なランダムな文字列を使用すること
   - SECRET_KEYを公開リポジトリにコミットしないこと
   - 定期的にローテーションすることを推奨

2. **HTTPS の使用**
   - 本番環境では必ずHTTPSを使用すること
   - トークンは平文で送信されるため、HTTPSなしでは盗聴のリスクがある

3. **トークンの有効期限**
   - デフォルトでは30分に設定
   - セキュリティ要件に応じて調整すること
   - リフレッシュトークンの実装も検討すること

4. **CORS設定**
   - 本番環境では`allow_origins`を適切に設定すること
   - `"*"`（全てのオリジンを許可）は開発時のみ使用

5. **パスワードポリシー**
   - 最小文字数、複雑さの要件を設定することを推奨
   - フロントエンドでバリデーションを実装すること

## トラブルシューティング

### 401 Unauthorized エラー

**原因:**
- トークンが無効または期限切れ
- トークンが正しく送信されていない

**解決方法:**
1. トークンの形式を確認（`Bearer {token}`）
2. トークンの有効期限を確認
3. 再度ログインしてトークンを取得

### SECRET_KEY エラー

**エラーメッセージ:**
```
RuntimeError: SECRET_KEY is not set in environment variables.
```

**解決方法:**
1. `.env`ファイルを作成
2. `SECRET_KEY`を追加
3. ランダムな文字列を生成して設定

```bash
# ランダムなSECRET_KEYを生成
openssl rand -hex 32
```

### トークンがローカルストレージに保存されない

**原因:**
- ブラウザのローカルストレージが無効
- プライベートブラウジングモード

**解決方法:**
- ブラウザの設定を確認
- 通常モードで開く
- Cookie ベースの認証を検討

## 今後の拡張

1. **リフレッシュトークン**
   - 長期間有効なリフレッシュトークンを実装
   - アクセストークンの自動更新

2. **パスワードリセット機能**
   - メールによるパスワードリセット
   - セキュリティ質問

3. **多要素認証（MFA）**
   - TOTP（Google Authenticator等）
   - SMS認証

4. **ソーシャルログイン**
   - Google OAuth
   - GitHub OAuth

5. **セッション管理**
   - アクティブなセッションの一覧表示
   - 特定のセッションの無効化
