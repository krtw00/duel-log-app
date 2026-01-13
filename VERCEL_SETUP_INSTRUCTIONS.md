# Vercel環境変数設定手順

以下の手順に従って、Vercelに環境変数を設定してください。

---

## 設定する環境変数

以下の3つの環境変数を設定します：

| 変数名 | 値 |
|:---|:---|
| `VITE_API_URL` | `https://duel-log-app.onrender.com` |
| `VITE_SUPABASE_URL` | `https://vdzyixwbikouwkhvvwkn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYwODcsImV4cCI6MjA4Mzg0MjA4N30.Mpgux_8DSAebHK1N6UaayANmGL41q9w2U1kMEW_gcPA` |

---

## 設定手順

### ステップ1: Vercelダッシュボードを開く

1. ブラウザで https://vercel.com/dashboard を開く
2. ログインしていない場合はログイン

### ステップ2: プロジェクトを選択

1. ダッシュボードから **「duel-log-app」** プロジェクトをクリック
   - または、プロジェクト一覧から選択

### ステップ3: 設定ページに移動

1. プロジェクトページで上部の **「Settings」** タブをクリック
2. 左サイドバーから **「Environment Variables」** を選択

### ステップ4: 環境変数を追加

以下の3つの環境変数を1つずつ追加します：

#### 1. VITE_API_URL

1. **「Key」** フィールドに `VITE_API_URL` と入力
2. **「Value」** フィールドに `https://duel-log-app.onrender.com` と入力
3. **環境の選択**:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
   - **すべてにチェック**を入れてください
4. **「Save」** または **「Add」** ボタンをクリック

#### 2. VITE_SUPABASE_URL

1. **「Key」** フィールドに `VITE_SUPABASE_URL` と入力
2. **「Value」** フィールドに `https://vdzyixwbikouwkhvvwkn.supabase.co` と入力
3. **環境の選択**: すべてにチェック（Production, Preview, Development）
4. **「Save」** または **「Add」** ボタンをクリック

#### 3. VITE_SUPABASE_ANON_KEY

1. **「Key」** フィールドに `VITE_SUPABASE_ANON_KEY` と入力
2. **「Value」** フィールドに以下の値を入力:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjYwODcsImV4cCI6MjA4Mzg0MjA4N30.Mpgux_8DSAebHK1N6UaayANmGL41q9w2U1kMEW_gcPA
   ```
3. **環境の選択**: すべてにチェック（Production, Preview, Development）
4. **「Save」** または **「Add」** ボタンをクリック

### ステップ5: 再デプロイ

環境変数を追加したら、最新のデプロイメントを再デプロイします：

1. プロジェクトページで **「Deployments」** タブをクリック
2. 一番上の最新デプロイメント（一番新しいもの）の右側にある **「...」** メニューをクリック
3. **「Redeploy」** を選択
4. 確認ダイアログで **「Redeploy」** をクリック

---

## 確認

再デプロイが完了したら（通常1〜2分）：

1. https://duel-log-app.vercel.app にアクセス
2. ログインページが表示されることを確認
3. 白い画面やエラーが表示されないことを確認

---

## トラブルシューティング

### まだ白い画面が表示される

1. 環境変数が正しく設定されているか確認
   - Settings → Environment Variables で3つすべてが表示されているか
   - すべての環境（Production, Preview, Development）にチェックが入っているか

2. 再デプロイが完了しているか確認
   - Deployments タブで最新のデプロイが **「Ready」** になっているか

3. ブラウザのキャッシュをクリア
   - Ctrl+Shift+R (Windows/Linux) または Cmd+Shift+R (Mac) でハードリロード

### 環境変数が見つからない

- 必ず `VITE_` プレフィックスが付いていることを確認
- スペルミスがないか確認
- 大文字小文字が正確か確認

---

## 完了後

設定が完了したら、このファイルは削除してください。
機密情報（JWT SecretやDatabase Password）が含まれていないため、安全ですが、整理のため削除をお勧めします。

```bash
rm VERCEL_SETUP_INSTRUCTIONS.md
```
