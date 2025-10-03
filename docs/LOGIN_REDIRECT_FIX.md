# ログイン後の画面遷移エラー修正ガイド

## 🚨 問題の状況

- ログインAPIは成功（200 OK）
- `/me` エンドポイントが401エラーを返す
- ログイン画面から遷移しない

## 🔍 原因

クロスオリジン（Vercel → Render）の環境では、デフォルトのクッキー設定ではクッキーが送信されません。

### 必要な設定

1. **バックエンド**: `SameSite=None` と `Secure=True` の設定
2. **フロントエンド**: Axiosで`withCredentials: true`の設定（既に設定済み）
3. **CORS**: `Access-Control-Allow-Credentials: true`の設定（既に設定済み）

## ✅ 解決方法

### ステップ1: コードをGitHubにプッシュ

```bash
cd C:\Users\grand\work\duel-log-app

git add .
git commit -m "Fix cross-origin cookie authentication"
git push
```

### ステップ2: Render環境変数の確認

Renderダッシュボードで以下の環境変数が設定されているか確認：

```
ENVIRONMENT = production  ← 重要！これがないとSameSite=Noneにならない
FRONTEND_URL = https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app
DATABASE_URL = postgresql://...
SECRET_KEY = ... (32文字以上)
```

### ステップ3: 再デプロイを待つ

GitHubへのプッシュ後、Renderが自動的に再デプロイします（2-5分）。

### ステップ4: 動作確認

1. **ブラウザのキャッシュとクッキーをクリア**
   ```
   F12 → Application タブ → Clear storage → Clear site data
   ```

2. **Vercelアプリを開く**
   - https://duel-log-b4ou8cpzu-krtw00s-projects.vercel.app

3. **ログインを試す**
   - ログイン成功後、ダッシュボードに遷移するはずです

4. **開発者ツールでクッキーを確認**
   ```
   F12 → Application → Cookies → https://duel-log-app.onrender.com
   ```
   
   `access_token` クッキーが以下の設定になっているか確認：
   - ✅ HttpOnly: true
   - ✅ Secure: true
   - ✅ SameSite: None

## 🔍 トラブルシューティング

### 問題1: まだ401エラーが出る

#### 確認1: Renderのログを確認

Render → Logs タブで以下を検索：

```
Cookie settings - SameSite: none, Secure: True
```

この行が表示されない場合、`ENVIRONMENT=production`が設定されていません。

#### 確認2: ブラウザのクッキーを確認

開発者ツール → Application → Cookies

- `access_token` が `https://duel-log-app.onrender.com` に保存されているか
- `SameSite` が `None` になっているか
- `Secure` が `true` になっているか

#### 確認3: ネットワークタブでリクエストヘッダーを確認

開発者ツール → Network → `/me` リクエストを選択

**Request Headers** に `Cookie: access_token=...` が含まれているか確認。

含まれていない場合、ブラウザがクッキーを送信していません。

### 問題2: クッキーが設定されない

#### 原因A: HTTPSでない

`SameSite=None` を使用するには、必ずHTTPSが必要です。

- ✅ Vercel: 自動的にHTTPS
- ✅ Render: 自動的にHTTPS
- ❌ localhost: HTTPなので開発環境では`SameSite=Lax`を使用

#### 原因B: ENVIRONMENT変数が未設定

Renderで`ENVIRONMENT=production`を設定してください。

### 問題3: ログインは成功するが /me で401エラー

これはクッキーが送信されていないことを意味します。

#### デバッグ手順

1. **ログインリクエストのレスポンスヘッダーを確認**
   ```
   Set-Cookie: access_token=...; HttpOnly; SameSite=None; Secure; Path=/
   ```

2. **/me リクエストのリクエストヘッダーを確認**
   ```
   Cookie: access_token=...
   ```

3. クッキーが送信されていない場合、以下を確認：
   - ブラウザがサードパーティクッキーをブロックしていないか
   - 開発者ツール → Application → Cookies で確認

### 問題4: サードパーティクッキーがブロックされている

最近のブラウザ（Chrome、Firefox）はサードパーティクッキーを制限しています。

#### 解決策A: 同じドメインを使用（推奨）

フロントエンドとバックエンドを同じドメインで運用：

```
https://yourapp.com          ← フロントエンド
https://api.yourapp.com      ← バックエンド
```

#### 解決策B: ブラウザの設定を変更（開発時のみ）

Chrome設定 → プライバシーとセキュリティ → サードパーティのCookieを許可

**注意**: 本番環境では推奨しません。

## 🎯 推奨される本番環境の構成

### オプション1: サブドメインの使用（最も推奨）

```
フロントエンド: https://app.yourdomain.com
バックエンド:   https://api.yourdomain.com
```

この構成では、同じルートドメイン（yourdomain.com）なので、クッキーの問題が発生しにくくなります。

### オプション2: JWTをローカルストレージに保存

クッキーの代わりにローカルストレージを使用：

**メリット**:
- クロスオリジンの問題がない
- サードパーティクッキーの制限を受けない

**デメリット**:
- XSS攻撃に脆弱
- HttpOnlyの保護がない

### オプション3: 現在の構成を維持

Vercel + Renderの構成でクッキー認証を使用：

**必要な設定**:
- `SameSite=None`
- `Secure=True`
- `withCredentials=true`
- ユーザーがサードパーティクッキーを許可

## 📊 確認チェックリスト

- [ ] `ENVIRONMENT=production` がRenderに設定されている
- [ ] GitHubに最新のコードがプッシュされている
- [ ] Renderの再デプロイが完了している
- [ ] Renderのログに「Cookie settings - SameSite: none, Secure: True」が表示される
- [ ] ブラウザのキャッシュとクッキーがクリアされている
- [ ] ログイン時に`Set-Cookie`ヘッダーが`SameSite=None; Secure`を含んでいる
- [ ] `/me`リクエストに`Cookie`ヘッダーが含まれている
- [ ] ブラウザがサードパーティクッキーを許可している

## ✨ 完了！

すべての設定が正しく行われると、ログイン後に正常にダッシュボードへ遷移できるようになります。
