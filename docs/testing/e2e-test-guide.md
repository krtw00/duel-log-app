# E2Eテストガイド（agent-browser使用）

## 概要

`agent-browser`を使用したUIベースのE2Eテストガイド。
Claude Codeワーカーが実際のブラウザを操作してテストを実行する。

## 前提条件

- agent-browser がインストール済み
- 開発サーバーが起動済み（`./scripts/dev.sh`）
- フロントエンド: http://localhost:5173
- バックエンド: http://127.0.0.1:8000

## agent-browser コマンド一覧

```bash
agent-browser open "URL"           # ページを開く
agent-browser snapshot             # アクセシビリティツリー取得（要素のrefを含む）
agent-browser snapshot -i          # インタラクティブ要素のみ
agent-browser click @ref           # 要素をクリック
agent-browser fill @ref "テキスト"  # フォームに入力
agent-browser screenshot           # スクリーンショット取得
agent-browser close                # ブラウザを閉じる
```

## テストシナリオ

### 1. 認証フロー

#### 1.1 ログインテスト

```bash
# 1. ログインページを開く
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i

# 2. メールアドレスを入力
agent-browser fill @email-input "test@example.com"

# 3. パスワードを入力
agent-browser fill @password-input "testpassword"

# 4. ログインボタンをクリック
agent-browser click @login-button

# 5. ダッシュボードにリダイレクトされたことを確認
agent-browser snapshot
# 期待: ダッシュボード要素が表示される
```

#### 1.2 ログアウトテスト

```bash
# 1. ダッシュボードで認証済み状態を確認
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 2. ユーザーメニューを開く
agent-browser click @user-menu

# 3. ログアウトをクリック
agent-browser click @logout-button

# 4. ログインページにリダイレクトされたことを確認
agent-browser snapshot
```

### 2. デュエル記録フロー

#### 2.1 デュエル追加テスト

```bash
# 1. ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 2. デュエル追加ボタンをクリック
agent-browser click @add-duel-button

# 3. デッキを選択
agent-browser click @my-deck-select
agent-browser click @deck-option-1

# 4. 相手デッキを選択
agent-browser click @opponent-deck-select
agent-browser click @opponent-deck-option-1

# 5. 結果を選択（勝利）
agent-browser click @result-win

# 6. 保存
agent-browser click @save-duel-button

# 7. デュエルが追加されたことを確認
agent-browser snapshot
```

### 3. 統計表示フロー

#### 3.1 統計ページ表示テスト

```bash
# 1. 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot

# 2. ゲームモードタブを切り替え
agent-browser click @tab-rate

# 3. グラフが表示されていることを確認
agent-browser snapshot
```

#### 3.2 統計共有テスト

```bash
# 1. 統計ページを開く
agent-browser open "http://localhost:5173/statistics"
agent-browser snapshot -i

# 2. 共有ボタンをクリック
agent-browser click @share-button

# 3. 共有ダイアログが表示されることを確認
agent-browser snapshot

# 4. 共有リンクをコピー
agent-browser click @copy-link-button

# 5. ダイアログを閉じる
agent-browser click @close-dialog
```

### 4. アクセシビリティテスト

#### 4.1 キーボードナビゲーションテスト

```bash
# 1. ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"

# 2. Tabキーでフォーカス移動を確認
# (agent-browserではキーボードイベント送信が限定的)

# 3. スクリーンショットでフォーカス表示を確認
agent-browser screenshot
```

### 5. OBSオーバーレイテスト

#### 5.1 オーバーレイ表示テスト

```bash
# 1. OBSオーバーレイページを開く（トークン付き）
agent-browser open "http://localhost:5173/obs?token=xxx"
agent-browser snapshot

# 2. 統計情報が表示されていることを確認
# 期待: 勝率、連勝数などが表示される
```

## テスト実行のベストプラクティス

### 1. テスト前の準備

```bash
# 開発サーバー起動確認
curl -s http://localhost:5173 > /dev/null && echo "フロントエンド: OK"
curl -s http://127.0.0.1:8000/health > /dev/null && echo "バックエンド: OK"

# テストデータのセットアップ
# (必要に応じてシードデータを投入)
```

### 2. テスト後のクリーンアップ

```bash
# ブラウザを閉じる
agent-browser close

# テストデータの削除（必要に応じて）
```

### 3. エラーハンドリング

- スナップショットで要素が見つからない場合は待機後に再試行
- タイムアウトの場合はサーバー状態を確認
- スクリーンショットでエラー状態を記録

## 要素参照（ref）の取得方法

```bash
# スナップショットを取得
agent-browser snapshot -i

# 出力例:
# @ref1 button "ログイン"
# @ref2 input type="email"
# @ref3 input type="password"

# refを使用してアクション実行
agent-browser click @ref1
agent-browser fill @ref2 "test@example.com"
```

## 注意事項

1. **セレクタの安定性**: data-testid属性を使用することを推奨
2. **非同期処理**: API呼び出し後は適切な待機が必要
3. **認証状態**: テスト間で認証状態が共有される場合がある
4. **ブラウザ状態**: テスト前にclose→openでクリーンな状態にする

## 関連ドキュメント

- [並列開発ガイド](/.claude/rules/parallel-dev.md)
- [バックエンドテストガイド](/.claude/rules/backend.md)
- [フロントエンドガイド](/.claude/rules/frontend.md)
