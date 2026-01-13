# Supabase OAuth設定手順

OAuth認証（Google、Discord）を有効化するための設定手順です。

---

## 問題の原因

「接続できずアクセスできない」エラーは、以下のいずれかが原因です：

1. SupabaseでOAuthプロバイダーが有効化されていない
2. リダイレクトURLが正しく設定されていない
3. Google/Discord Developer Consoleでの設定が不完全

---

## 設定手順

### ステップ1: Supabaseダッシュボードを開く

1. https://supabase.com/dashboard/project/vdzyixwbikouwkhvvwkn を開く
2. ログインしていない場合はログイン

### ステップ2: 認証設定ページに移動

1. 左サイドバーから **「Authentication」**（鍵のアイコン）をクリック
2. 左メニューから **「Providers」** を選択

### ステップ3: リダイレクトURL設定

Providersページの一番上に **「Configuration」** セクションがあります。

**「Site URL」** を設定:
```
https://duel-log-app.vercel.app
```

**「Redirect URLs」** に以下を追加:
```
https://duel-log-app.vercel.app/auth/callback
http://localhost:5173/auth/callback
```

複数のURLを追加する場合は、**改行**で区切ります。

✅ **「Save」** をクリック

---

## Google OAuth設定

### A. Google Cloud Consoleでの設定

#### 1. プロジェクトを作成（まだの場合）

1. https://console.cloud.google.com/ を開く
2. 新しいプロジェクトを作成（例: "duel-log-app"）

#### 2. OAuth同意画面の設定

1. **「APIs & Services」** → **「OAuth consent screen」**
2. **User Type**: 「External」を選択
3. **「Create」** をクリック
4. 必須項目を入力:
   - **App name**: `Duel Log App`
   - **User support email**: あなたのメールアドレス
   - **Developer contact information**: あなたのメールアドレス
5. **「Save and Continue」**
6. **Scopes**: デフォルトのまま **「Save and Continue」**
7. **Test users**: （オプション）テストユーザーを追加
8. **「Save and Continue」**

#### 3. OAuth 2.0 Client IDの作成

1. **「Credentials」** タブをクリック
2. **「+ CREATE CREDENTIALS」** → **「OAuth client ID」**
3. **Application type**: 「Web application」
4. **Name**: `Duel Log App Web Client`
5. **Authorized redirect URIs** に以下を追加:
   ```
   https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback
   ```
   **重要:** このURLは必ずSupabaseプロジェクトのURLです
6. **「Create」** をクリック
7. **Client ID** と **Client Secret** をコピー

### B. SupabaseでGoogle OAuthを有効化

1. Supabaseダッシュボードの **「Authentication」** → **「Providers」**
2. **「Google」** を探してクリック
3. **「Enable Sign in with Google」** をオンにする
4. Google Cloud Consoleでコピーした情報を入力:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`
5. **「Save」** をクリック

---

## Discord OAuth設定

### A. Discord Developer Portalでの設定

#### 1. アプリケーションを作成

1. https://discord.com/developers/applications を開く
2. **「New Application」** をクリック
3. **Name**: `Duel Log App`
4. **「Create」** をクリック

#### 2. OAuth2設定

1. 左メニューから **「OAuth2」** をクリック
2. **「Redirects」** セクションで **「Add Redirect」**
3. 以下のURLを追加:
   ```
   https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback
   ```
   **重要:** このURLは必ずSupabaseプロジェクトのURLです
4. **「Save Changes」** をクリック
5. **「Client ID」** と **「Client Secret」** をコピー

### B. SupabaseでDiscord OAuthを有効化

1. Supabaseダッシュボードの **「Authentication」** → **「Providers」**
2. **「Discord」** を探してクリック
3. **「Enable Sign in with Discord」** をオンにする
4. Discord Developer Portalでコピーした情報を入力:
   - **Client ID**: `your-discord-client-id`
   - **Client Secret**: `your-discord-client-secret`
5. **「Save」** をクリック

---

## 設定確認のチェックリスト

### Supabase設定

- [ ] Site URLが `https://duel-log-app.vercel.app` に設定されている
- [ ] Redirect URLsに以下が含まれている:
  - [ ] `https://duel-log-app.vercel.app/auth/callback`
  - [ ] `http://localhost:5173/auth/callback`（開発用）
- [ ] Google Providerが有効（緑色のトグル）
- [ ] Discord Providerが有効（緑色のトグル）

### Google Cloud Console

- [ ] OAuth同意画面が設定されている
- [ ] OAuth Client IDが作成されている
- [ ] Authorized redirect URIsに以下が設定されている:
  - [ ] `https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback`

### Discord Developer Portal

- [ ] アプリケーションが作成されている
- [ ] OAuth2 Redirectsに以下が設定されている:
  - [ ] `https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback`

---

## テスト手順

設定完了後、以下の手順でテストします：

1. https://duel-log-app.vercel.app にアクセス
2. **「Googleでログイン」** または **「Discordでログイン」** をクリック
3. OAuth同意画面にリダイレクトされる
4. 認証を許可
5. `/auth/callback` を経由してダッシュボードにリダイレクトされる

---

## トラブルシューティング

### エラー: "Invalid redirect URI"

**原因:** リダイレクトURIの設定が間違っている

**解決策:**
- Google/Discord Developer Consoleで設定したURLが正確に `https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback` であることを確認
- URLに余分なスペースやスラッシュがないか確認

### エラー: "OAuth provider not enabled"

**原因:** SupabaseでOAuthプロバイダーが有効化されていない

**解決策:**
- Supabase → Authentication → Providers で該当プロバイダーのトグルが緑色（ON）になっているか確認

### エラー: "Redirect URL not allowed"

**原因:** Supabaseの「Redirect URLs」に正しいURLが設定されていない

**解決策:**
- Supabase → Authentication → URL Configuration で `https://duel-log-app.vercel.app/auth/callback` が追加されているか確認

### ログインボタンをクリックしても何も起こらない

**原因:** フロントエンドのコードまたはSupabase URLが正しくない

**解決策:**
- ブラウザのコンソール（F12）でエラーを確認
- Vercelの環境変数が正しく設定されているか確認

---

## 重要な注意点

1. **Supabase Callback URL**:
   - Google/Discordには `https://vdzyixwbikouwkhvvwkn.supabase.co/auth/v1/callback` を設定
   - これはSupabaseが内部で処理するURLです

2. **アプリのRedirect URL**:
   - Supabaseには `https://duel-log-app.vercel.app/auth/callback` を設定
   - これはOAuth完了後にユーザーがリダイレクトされる先です

3. **2つは異なるURL**です！混同しないように注意してください。

---

## 参考リンク

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth with Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)
