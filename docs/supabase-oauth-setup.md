# Supabase OAuth設定ガイド

本ドキュメントでは、Duel Log AppでGoogle/Discord OAuthを使用するための設定手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [Supabase Dashboard設定](#supabase-dashboard設定)
3. [Google OAuth設定](#google-oauth設定)
4. [Discord OAuth設定](#discord-oauth設定)
5. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- Supabaseプロジェクトが作成済みであること
- 本番環境のフロントエンドがデプロイ済みであること（例: Vercel）
- Google Cloud Console / Discord Developer Portalへのアクセス権限

---

## Supabase Dashboard設定

### 1. URL Configurationの設定

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左メニューから **Authentication** → **URL Configuration** を開く
4. 以下を設定:

| 項目 | 値 | 例 |
|------|-----|-----|
| Site URL | 本番フロントエンドURL | `https://duel-log.vercel.app` |
| Redirect URLs | コールバックURLを追加 | `https://duel-log.vercel.app/auth/callback` |

**重要**: Redirect URLsには以下のパターンを追加してください:
- `https://your-domain.vercel.app/auth/callback` (本番)
- `https://*.vercel.app/auth/callback` (プレビューデプロイ用、ワイルドカード)

### 2. Supabaseコールバック URL の確認

OAuthプロバイダー側で設定する必要があるSupabaseのコールバックURLは以下の形式です:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

`<project-ref>` は Supabase Dashboard の **Settings** → **General** で確認できます。

---

## Google OAuth設定

### Step 1: Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）

### Step 2: OAuth同意画面の設定

1. 左メニューから **APIs & Services** → **OAuth consent screen** を選択
2. User Type: **External** を選択
3. 必要な情報を入力:
   - App name: `Duel Log`
   - User support email: あなたのメールアドレス
   - Developer contact: あなたのメールアドレス
4. **Save and Continue**

### Step 3: OAuth認証情報の作成

1. 左メニューから **APIs & Services** → **Credentials** を選択
2. **+ CREATE CREDENTIALS** → **OAuth client ID** をクリック
3. Application type: **Web application** を選択
4. Name: `Duel Log Web Client`
5. **Authorized redirect URIs** に以下を追加:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

6. **Create** をクリック
7. **Client ID** と **Client Secret** をコピー（後で使用）

### Step 4: Supabase側でGoogle OAuthを有効化

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** をクリック
3. **Enable Sign in with Google** をONにする
4. 以下を入力:

| 項目 | 値 |
|------|-----|
| Client ID | Google Cloud Consoleでコピーした値 |
| Client Secret | Google Cloud Consoleでコピーした値 |

5. **Save** をクリック

---

## Discord OAuth設定

### Step 1: Discord Developer Portal設定

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. **New Application** をクリック
3. Name: `Duel Log` を入力し **Create**

### Step 2: OAuth2設定

1. 左メニューから **OAuth2** → **General** を選択
2. **Redirects** セクションで **Add Redirect** をクリック
3. 以下のURLを追加:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

4. **Save Changes** をクリック

### Step 3: クライアント情報の取得

1. **OAuth2** → **General** ページで以下をコピー:
   - **CLIENT ID**
   - **CLIENT SECRET** (Reset Secretで生成が必要な場合あり)

### Step 4: Supabase側でDiscord OAuthを有効化

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Discord** をクリック
3. **Enable Sign in with Discord** をONにする
4. 以下を入力:

| 項目 | 値 |
|------|-----|
| Client ID | Discord Developer Portalでコピーした値 |
| Client Secret | Discord Developer Portalでコピーした値 |

5. **Save** をクリック

---

## トラブルシューティング

### 「redirect_uri_mismatch」エラー

**原因**: OAuthプロバイダーに登録されたリダイレクトURIと、実際のリダイレクトURIが一致していない

**解決策**:
1. Google Cloud Console / Discord Developer Portalで登録したリダイレクトURIを確認
2. 以下の形式であることを確認:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. URLの末尾にスラッシュがないことを確認

### 「access_denied」エラー

**原因**: OAuth同意画面がテストモードで、テストユーザーに追加されていない

**解決策**:
1. Google Cloud Console → **OAuth consent screen** → **Test users**
2. テストしたいGoogleアカウントを追加
3. または、**Publishing status** を **In production** に変更（本番公開時）

### OAuth後にログイン画面に戻される

**原因**: Supabase DashboardのRedirect URLsに正しいURLが登録されていない

**解決策**:
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Redirect URLs** に以下を追加:
   ```
   https://your-domain.vercel.app/auth/callback
   ```

### セッションが確立されない

**原因**: フロントエンドとSupabaseのURL設定の不一致

**解決策**:
1. フロントエンドの環境変数を確認:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
2. Vercelの環境変数設定を確認

---

## 設定チェックリスト

### Google OAuth
- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] OAuth同意画面を設定
- [ ] OAuth認証情報を作成
- [ ] リダイレクトURIを追加: `https://<ref>.supabase.co/auth/v1/callback`
- [ ] Supabase DashboardでGoogle Providerを有効化
- [ ] Client IDとSecretを設定

### Discord OAuth
- [ ] Discord Developer Portalでアプリケーション作成
- [ ] OAuth2設定でリダイレクトURLを追加: `https://<ref>.supabase.co/auth/v1/callback`
- [ ] Supabase DashboardでDiscord Providerを有効化
- [ ] Client IDとSecretを設定

### Supabase URL Configuration
- [ ] Site URLを本番URLに設定
- [ ] Redirect URLsにコールバックパスを追加

---

## 参考リンク

- [Supabase Auth - Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - Discord OAuth](https://supabase.com/docs/guides/auth/social-login/auth-discord)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
