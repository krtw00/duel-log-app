# 対戦記録 E2Eテストケース

## 概要
対戦記録機能（登録、編集、削除、一覧表示）のE2Eテストケース。
agent-browserを使用してUIレベルでの動作確認を行う。

---

## TC-DUEL-001: 対戦記録の新規登録

### 目的
新しい対戦記録を正常に登録できることを確認する。

### 前提条件
- ログイン済み状態である
- 自分のデッキと相手のデッキが登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | ダッシュボードが表示される |
| 2 | 「対戦記録追加」ボタンをクリック | 対戦記録登録ダイアログが表示される |
| 3 | 自分のデッキを選択 | 選択値が反映される |
| 4 | 相手のデッキを選択 | 選択値が反映される |
| 5 | 対戦結果を選択 | 選択値が反映される |
| 6 | ゲームモードを選択 | 選択値が反映される |
| 7 | 先攻/後攻を選択 | 選択値が反映される |
| 8 | 「登録」ボタンをクリック | 対戦記録が一覧に追加される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 対戦記録追加ボタンをクリック
agent-browser click @add-duel-button

# ダイアログが開いたことを確認
agent-browser snapshot -i

# 自分のデッキを選択
agent-browser click @my-deck-select
agent-browser snapshot -i
agent-browser click @my-deck-option-0

# 相手のデッキを選択
agent-browser click @opponent-deck-select
agent-browser snapshot -i
agent-browser click @opponent-deck-option-0

# 対戦結果を選択（勝利）
agent-browser click @result-win

# ゲームモードを選択
agent-browser click @game-mode-select
agent-browser snapshot -i
agent-browser click @game-mode-ranked

# 先攻/後攻を選択（先攻）
agent-browser click @turn-order-first

# 登録ボタンをクリック
agent-browser click @register-button

# 対戦記録一覧を確認
agent-browser snapshot
# 期待: 登録した対戦記録が一覧に表示される
# 期待: ダイアログが閉じている

agent-browser screenshot
```

### 備考
- 必須項目が全て入力されていることを確認
- 登録後に対戦記録一覧が更新されることを確認

---

## TC-DUEL-002: 対戦記録の編集

### 目的
既存の対戦記録を正常に編集できることを確認する。

### 前提条件
- ログイン済み状態である
- 編集対象の対戦記録が存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 対戦記録一覧が表示される |
| 2 | 対象記録の編集ボタンをクリック | 編集ダイアログが表示される |
| 3 | 対戦結果を変更 | 選択値が反映される |
| 4 | メモを追加 | 入力値が反映される |
| 5 | 「保存」ボタンをクリック | 変更が保存される |
| 6 | 編集した記録を確認 | 変更内容が一覧に反映される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 最初の対戦記録の編集ボタンをクリック
agent-browser click @edit-duel-button-0

# 編集ダイアログが開いたことを確認
agent-browser snapshot -i

# 対戦結果を変更（敗北に変更）
agent-browser click @result-lose

# メモを追加
agent-browser fill @memo-input "相手のコンボが強力だった"

# 保存ボタンをクリック
agent-browser click @save-button

# 対戦記録一覧を確認
agent-browser snapshot
# 期待: 対戦結果が「敗北」に変更されている
# 期待: メモが表示されている

agent-browser screenshot
```

### 備考
- 既存の対戦記録情報が編集フォームに正しく表示されることを確認
- 保存後にダイアログが閉じることを確認

---

## TC-DUEL-003: 対戦記録の削除

### 目的
既存の対戦記録を正常に削除できることを確認する。

### 前提条件
- ログイン済み状態である
- 削除対象の対戦記録が存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 対戦記録一覧が表示される |
| 2 | 対象記録の削除ボタンをクリック | 確認ダイアログが表示される |
| 3 | 「削除」ボタンをクリック | 記録が一覧から削除される |
| 4 | 対戦記録一覧を確認 | 削除した記録が表示されない |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 削除前の記録数を確認
agent-browser snapshot
# 期待: 削除対象の記録が存在する

# 最初の対戦記録の削除ボタンをクリック
agent-browser click @delete-duel-button-0

# 確認ダイアログが開いたことを確認
agent-browser snapshot -i

# 削除確認ボタンをクリック
agent-browser click @confirm-delete-button

# 対戦記録一覧を確認
agent-browser snapshot
# 期待: 削除した記録が一覧から消えている

agent-browser screenshot
```

### 備考
- 削除前に確認ダイアログが表示されることを確認
- 削除操作は不可逆であることをユーザーに通知すること

---

## TC-DUEL-004: 対戦記録の一覧表示とフィルタリング

### 目的
対戦記録の一覧が正しく表示され、フィルタリング機能が動作することを確認する。

### 前提条件
- ログイン済み状態である
- 複数の対戦記録が登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 対戦記録一覧が表示される |
| 2 | デッキでフィルタリング | 選択したデッキの記録のみ表示される |
| 3 | 対戦結果でフィルタリング | 選択した結果の記録のみ表示される |
| 4 | ゲームモードでフィルタリング | 選択したモードの記録のみ表示される |
| 5 | フィルタをクリア | 全ての記録が表示される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot

# 期待: 対戦記録一覧が表示される
# 期待: 各記録にデッキ名、対戦結果、日時が表示される

# デッキでフィルタリング
agent-browser click @filter-deck-select
agent-browser snapshot -i
agent-browser click @filter-deck-option-0
agent-browser snapshot
# 期待: 選択したデッキの記録のみが表示される

# 対戦結果でフィルタリング
agent-browser click @filter-result-select
agent-browser snapshot -i
agent-browser click @filter-result-win
agent-browser snapshot
# 期待: 勝利した記録のみが表示される

# ゲームモードでフィルタリング
agent-browser click @filter-mode-select
agent-browser snapshot -i
agent-browser click @filter-mode-ranked
agent-browser snapshot
# 期待: ランクマッチの記録のみが表示される

# フィルタをクリア
agent-browser click @clear-filters-button
agent-browser snapshot
# 期待: 全ての記録が再度表示される

agent-browser screenshot
```

### 備考
- 複数のフィルタを同時に適用できることを確認
- フィルタリング後も正しい順序（日時降順）で表示されることを確認

---

## TC-DUEL-005: 対戦記録の詳細表示

### 目的
対戦記録の詳細情報が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 詳細表示する対戦記録が存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 対戦記録一覧が表示される |
| 2 | 対象記録をクリック | 詳細ダイアログが表示される |
| 3 | 詳細情報を確認 | 全ての情報が表示される |
| 4 | 閉じるボタンをクリック | ダイアログが閉じる |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 最初の対戦記録をクリック
agent-browser click @duel-row-0

# 詳細ダイアログが開いたことを確認
agent-browser snapshot

# 期待: 以下の情報が表示される
# - 自分のデッキ名
# - 相手のデッキ名
# - 対戦結果
# - ゲームモード
# - 先攻/後攻
# - コイントス結果
# - レート
# - 対戦日時
# - メモ

agent-browser screenshot

# 閉じるボタンをクリック
agent-browser click @close-button
agent-browser snapshot
# 期待: ダイアログが閉じている
```

### 備考
- 全ての対戦情報が見やすく表示されることを確認

---

## TC-DUEL-006: バルク登録機能

### 目的
複数の対戦記録を一度に登録できることを確認する。

### 前提条件
- ログイン済み状態である
- 自分のデッキと相手のデッキが登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | ダッシュボードが表示される |
| 2 | 「バルク登録」ボタンをクリック | バルク登録ダイアログが表示される |
| 3 | CSVファイルをアップロード | ファイルが選択される |
| 4 | プレビューを確認 | アップロードするデータが表示される |
| 5 | 「一括登録」ボタンをクリック | 全ての記録が一覧に追加される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# バルク登録ボタンをクリック
agent-browser click @bulk-import-button

# ダイアログが開いたことを確認
agent-browser snapshot -i

# CSVファイルをアップロード（agent-browserではファイルアップロードの実装が必要）
# 注意: このステップは実装により異なる可能性がある
agent-browser click @file-upload-button
# ファイル選択のシミュレーションが必要

# プレビューを確認
agent-browser snapshot
# 期待: アップロードするデータのプレビューが表示される

# 一括登録ボタンをクリック
agent-browser click @confirm-bulk-import-button

# 対戦記録一覧を確認
agent-browser snapshot
# 期待: バルク登録した記録が全て一覧に追加される

agent-browser screenshot
```

### 備考
- CSVファイルのフォーマットが正しいことを確認
- エラーがある場合は適切なエラーメッセージが表示されることを確認

---

## TC-DUEL-007: 必須項目未入力での登録（異常系）

### 目的
必須項目が未入力の場合、登録できないことを確認する。

### 前提条件
- ログイン済み状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | ダッシュボードが表示される |
| 2 | 「対戦記録追加」ボタンをクリック | 対戦記録登録ダイアログが表示される |
| 3 | 必須項目を未入力のまま登録ボタンをクリック | エラーメッセージが表示される |
| 4 | エラーメッセージを確認 | 「必須項目を入力してください」と表示される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 対戦記録追加ボタンをクリック
agent-browser click @add-duel-button

# 何も入力せずに登録ボタンをクリック
agent-browser click @register-button

# エラーメッセージを確認
agent-browser snapshot
# 期待: 「自分のデッキを選択してください」などのバリデーションメッセージが表示される
# 期待: ダイアログが閉じていない

agent-browser screenshot
```

### 備考
- クライアント側のバリデーションが動作することを確認
- どのフィールドにエラーがあるか明確に表示されることを確認

---

## TC-DUEL-008: 日付範囲でのフィルタリング

### 目的
日付範囲を指定して対戦記録をフィルタリングできることを確認する。

### 前提条件
- ログイン済み状態である
- 異なる日付の対戦記録が複数存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | 対戦記録一覧が表示される |
| 2 | 開始日を選択 | 選択値が反映される |
| 3 | 終了日を選択 | 選択値が反映される |
| 4 | フィルタを適用 | 指定期間の記録のみ表示される |

### agent-browser コマンド

```bash
# ダッシュボードを開く
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot -i

# 開始日を選択
agent-browser click @date-from-input
agent-browser fill @date-from-input "2024-01-01"

# 終了日を選択
agent-browser click @date-to-input
agent-browser fill @date-to-input "2024-01-31"

# フィルタを適用
agent-browser click @apply-date-filter-button

# フィルタリング結果を確認
agent-browser snapshot
# 期待: 2024年1月の記録のみが表示される

agent-browser screenshot
```

### 備考
- 日付ピッカーが正しく動作することを確認
- 開始日と終了日の関係が正しく検証されることを確認

---

## カバレッジ

| テストID | 機能 | 正常系 | 異常系 | E2E対応 |
|----------|------|--------|--------|---------|
| TC-DUEL-001 | 対戦記録登録 | ✅ | - | ✅ |
| TC-DUEL-002 | 対戦記録編集 | ✅ | - | ✅ |
| TC-DUEL-003 | 対戦記録削除 | ✅ | - | ✅ |
| TC-DUEL-004 | 一覧・フィルタリング | ✅ | - | ✅ |
| TC-DUEL-005 | 詳細表示 | ✅ | - | ✅ |
| TC-DUEL-006 | バルク登録 | ✅ | - | ✅ |
| TC-DUEL-007 | 必須項目検証 | - | ✅ | ✅ |
| TC-DUEL-008 | 日付フィルタ | ✅ | - | ✅ |

## テスト実行順序の推奨

1. TC-DUEL-001（対戦記録登録） - テストデータを作成
2. TC-DUEL-005（詳細表示） - 登録した記録の詳細確認
3. TC-DUEL-004（一覧・フィルタリング） - フィルタリング機能の確認
4. TC-DUEL-008（日付フィルタ） - 日付範囲でのフィルタリング確認
5. TC-DUEL-002（対戦記録編集） - 編集機能の確認
6. TC-DUEL-007（必須項目検証） - バリデーションの確認
7. TC-DUEL-006（バルク登録） - 一括登録機能の確認
8. TC-DUEL-003（対戦記録削除） - 削除機能の確認
