# 🚀 エラーハンドリング実装 - クイックスタートガイド

## ⚡ すぐに試す（3ステップ）

### ステップ1: フロントエンドを再起動

```bash
cd C:\Users\grand\work\duel-log-app\frontend
npm run dev
```

### ステップ2: ブラウザでアクセス

http://localhost:5173 を開く

### ステップ3: テストしてみる

1. **ログイン**
   - メール: `grandchariot001@gmail.com`
   - パスワード: 既存のパスワード
   - ✅ 右上に緑色の「ログインに成功しました」が表示されます

2. **デッキ管理で新規作成**
   - 「デッキ管理」→「追加」
   - デッキ名を入力 → 「登録」
   - ✅ 「デッキを登録しました」が表示されます

3. **対戦記録を追加**
   - 「ダッシュボード」→「対戦記録を追加」
   - フォームに入力 → 「保存」
   - ✅ 「対戦記録を保存しました」が表示されます

---

## 🎨 新しい機能の確認

### トースト通知（右上に表示）

**成功メッセージ（緑）:**
- ログイン成功
- デッキ登録/更新/削除
- 対戦記録保存/削除

**エラーメッセージ（赤）:**
- ネットワークエラー
- 認証エラー
- バリデーションエラー

### ローディング表示

API通信中、画面中央にローディングアニメーションが表示されます。

---

## 🧪 エラーをわざと発生させてテスト

### 1. 認証エラー（401）のテスト

```
1. F12キーを押して開発者ツールを開く
2. Application > Local Storage > http://localhost:5173
3. "token" を削除
4. ページを更新（F5）
5. 赤色の「認証エラーです。再度ログインしてください」が表示される
6. 自動的にログイン画面に遷移する
```

### 2. ネットワークエラーのテスト

```bash
# バックエンドを停止
docker-compose stop backend

# フロントエンドで何か操作（デッキ追加など）を試す
# → 「サーバーに接続できません」が表示される

# バックエンドを再起動
docker-compose start backend
```

### 3. バリデーションエラーのテスト

```
1. デッキ管理画面で「追加」ボタンをクリック
2. デッキ名を空白のまま「登録」をクリック
3. フォームのバリデーションエラーが表示される
```

---

## 📝 実装されたファイル

### 新規作成
- ✅ `frontend/src/stores/notification.ts`
- ✅ `frontend/src/stores/loading.ts`
- ✅ `frontend/src/components/common/ToastNotification.vue`
- ✅ `frontend/src/components/common/LoadingOverlay.vue`

### 更新
- ✅ `frontend/src/services/api.ts`
- ✅ `frontend/src/App.vue`
- ✅ `frontend/src/views/LoginView.vue`
- ✅ `frontend/src/views/RegisterView.vue`
- ✅ `frontend/src/views/DashboardView.vue`
- ✅ `frontend/src/views/DecksView.vue`

---

## 🔍 トラブルシューティング

### 通知が表示されない場合

```bash
# フロントエンドを完全に再起動
Ctrl+C で停止
npm run dev
```

### TypeScriptエラーが出る場合

```bash
# node_modulesを再インストール
rm -rf node_modules
npm install
npm run dev
```

### ローディングが止まらない場合

ブラウザのコンソール（F12）を開いて、エラーを確認してください。

---

## ✨ 次は何をする？

エラーハンドリングの実装が完了しました。次のステップ：

1. **フィルタリング機能の実装**
   - 期間指定で対戦記録を絞り込む
   - デッキ別にフィルター
   - 勝敗でフィルター

2. **統計機能の拡充**
   - デッキ別勝率の詳細表示
   - 相手デッキ分析

3. **データ可視化**
   - Chart.jsでグラフ表示
   - 勝率推移グラフ

どれから始めますか？
