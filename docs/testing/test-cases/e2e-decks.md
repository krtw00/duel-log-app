# デッキ管理 E2Eテストケース

## 概要
デッキ管理機能（作成、編集、削除、一覧表示）のE2Eテストケース。
agent-browserを使用してUIレベルでの動作確認を行う。

---

## TC-DECK-001: デッキ新規作成

### 目的
新しいデッキを正常に作成できることを確認する。

### 前提条件
- ログイン済み状態である
- デッキページにアクセスできる

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 「デッキ追加」ボタンをクリック | デッキ作成ダイアログが表示される |
| 3 | デッキ名を入力 | 入力値が反映される |
| 4 | デッキタイプを選択 | 選択値が反映される |
| 5 | 「作成」ボタンをクリック | デッキが一覧に追加される |
| 6 | 作成したデッキを確認 | デッキ名とタイプが正しく表示される |

### agent-browser コマンド

```bash
# ログイン
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i
agent-browser fill @email-input "test@example.com"
agent-browser fill @password-input "password123"
agent-browser click @login-button

# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# デッキ追加ボタンをクリック
agent-browser click @add-deck-button

# ダイアログが開いたことを確認
agent-browser snapshot -i

# デッキ名を入力
agent-browser fill @deck-name-input "テストデッキ"

# デッキタイプを選択
agent-browser click @deck-type-select
agent-browser snapshot -i
agent-browser click @deck-type-option-mine

# 作成ボタンをクリック
agent-browser click @create-button

# デッキ一覧を確認
agent-browser snapshot
# 期待: 「テストデッキ」が一覧に表示される
# 期待: ダイアログが閉じている

agent-browser screenshot
```

### 備考
- デッキ名は必須入力項目であることを確認
- デッキタイプの選択肢が正しく表示されることを確認

---

## TC-DECK-002: デッキ編集

### 目的
既存デッキの情報を正常に編集できることを確認する。

### 前提条件
- ログイン済み状態である
- 編集対象のデッキが存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 対象デッキの編集ボタンをクリック | 編集ダイアログが表示される |
| 3 | デッキ名を変更 | 入力値が反映される |
| 4 | デッキタイプを変更 | 選択値が反映される |
| 5 | 「保存」ボタンをクリック | 変更が保存される |
| 6 | 編集したデッキを確認 | 変更内容が一覧に反映される |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# 最初のデッキの編集ボタンをクリック
agent-browser click @edit-deck-button-0

# 編集ダイアログが開いたことを確認
agent-browser snapshot -i

# デッキ名を変更
agent-browser fill @deck-name-input "編集後のデッキ名"

# デッキタイプを変更
agent-browser click @deck-type-select
agent-browser snapshot -i
agent-browser click @deck-type-option-opponent

# 保存ボタンをクリック
agent-browser click @save-button

# デッキ一覧を確認
agent-browser snapshot
# 期待: 「編集後のデッキ名」が一覧に表示される
# 期待: デッキタイプが「相手」に変更されている

agent-browser screenshot
```

### 備考
- 既存のデッキ情報が編集フォームに正しく表示されることを確認
- 保存後にダイアログが閉じることを確認

---

## TC-DECK-003: デッキ削除

### 目的
既存デッキを正常に削除できることを確認する。

### 前提条件
- ログイン済み状態である
- 削除対象のデッキが存在する
- デッキに紐づく対戦記録が存在しない

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 対象デッキの削除ボタンをクリック | 確認ダイアログが表示される |
| 3 | 「削除」ボタンをクリック | デッキが一覧から削除される |
| 4 | デッキ一覧を確認 | 削除したデッキが表示されない |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# 削除前のデッキ数を確認
agent-browser snapshot
# 期待: 削除対象のデッキが存在する

# 最初のデッキの削除ボタンをクリック
agent-browser click @delete-deck-button-0

# 確認ダイアログが開いたことを確認
agent-browser snapshot -i

# 削除確認ボタンをクリック
agent-browser click @confirm-delete-button

# デッキ一覧を確認
agent-browser snapshot
# 期待: 削除したデッキが一覧から消えている

agent-browser screenshot
```

### 備考
- 削除前に確認ダイアログが表示されることを確認
- 削除操作は不可逆であることをユーザーに通知すること

---

## TC-DECK-004: デッキ削除の拒否（異常系）

### 目的
対戦記録が紐づいているデッキは削除できないことを確認する。

### 前提条件
- ログイン済み状態である
- 対戦記録が紐づいているデッキが存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 対戦記録のあるデッキの削除ボタンをクリック | エラーメッセージが表示される |
| 3 | エラーメッセージを確認 | 「対戦記録があるため削除できません」と表示される |
| 4 | デッキ一覧を確認 | デッキが削除されていない |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# 対戦記録があるデッキの削除ボタンをクリック
agent-browser click @delete-deck-button-with-duels

# エラーメッセージを確認
agent-browser snapshot
# 期待: 「このデッキには対戦記録が紐づいているため削除できません」というメッセージが表示される

agent-browser screenshot
```

### 備考
- データの整合性を保つための制約が正しく動作することを確認

---

## TC-DECK-005: デッキ一覧表示

### 目的
デッキ一覧が正しく表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 複数のデッキが登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | デッキ情報を確認 | 各デッキの名前、タイプが表示される |
| 3 | デッキのフィルター機能を確認 | 自分/相手のデッキで絞り込める |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot

# 期待: デッキ一覧が表示される
# 期待: 各デッキに名前、タイプが表示される

# 自分のデッキのみ表示
agent-browser click @filter-my-decks
agent-browser snapshot
# 期待: 自分のデッキのみが表示される

# 相手のデッキのみ表示
agent-browser click @filter-opponent-decks
agent-browser snapshot
# 期待: 相手のデッキのみが表示される

# 全てのデッキを表示
agent-browser click @filter-all-decks
agent-browser snapshot
# 期待: 全てのデッキが表示される

agent-browser screenshot
```

### 備考
- デッキが存在しない場合は空の状態メッセージが表示されることを確認

---

## TC-DECK-006: デッキ名の重複チェック（異常系）

### 目的
同じ名前のデッキを作成しようとした際、適切なエラーメッセージが表示されることを確認する。

### 前提条件
- ログイン済み状態である
- 既に「既存デッキ」という名前のデッキが存在する

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 「デッキ追加」ボタンをクリック | デッキ作成ダイアログが表示される |
| 3 | 既存と同じデッキ名を入力 | 入力値が反映される |
| 4 | デッキタイプを選択 | 選択値が反映される |
| 5 | 「作成」ボタンをクリック | エラーメッセージが表示される |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# デッキ追加ボタンをクリック
agent-browser click @add-deck-button

# 既存と同じデッキ名を入力
agent-browser fill @deck-name-input "既存デッキ"

# デッキタイプを選択
agent-browser click @deck-type-select
agent-browser click @deck-type-option-mine

# 作成ボタンをクリック
agent-browser click @create-button

# エラーメッセージを確認
agent-browser snapshot
# 期待: 「同じ名前のデッキが既に存在します」というエラーが表示される

agent-browser screenshot
```

### 備考
- 同一ユーザー内でのデッキ名の一意性が保証されることを確認

---

## TC-DECK-007: デッキ検索機能

### 目的
デッキ一覧で検索機能が正常に動作することを確認する。

### 前提条件
- ログイン済み状態である
- 複数のデッキが登録されている

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | デッキページを開く | デッキ一覧が表示される |
| 2 | 検索ボックスにキーワードを入力 | 入力値が反映される |
| 3 | 検索結果を確認 | キーワードに一致するデッキのみ表示される |
| 4 | 検索ボックスをクリア | 全てのデッキが再度表示される |

### agent-browser コマンド

```bash
# デッキページを開く
agent-browser open "http://localhost:5173/decks"
agent-browser snapshot -i

# 検索ボックスにキーワードを入力
agent-browser fill @deck-search-input "テスト"

# 検索結果を確認
agent-browser snapshot
# 期待: 「テスト」を含むデッキのみが表示される

# 検索ボックスをクリア
agent-browser fill @deck-search-input ""

# 全てのデッキが表示されることを確認
agent-browser snapshot
# 期待: 全てのデッキが表示される

agent-browser screenshot
```

### 備考
- 検索は部分一致で動作することを確認
- 大文字小文字を区別しないことを確認

---

## カバレッジ

| テストID | 機能 | 正常系 | 異常系 | E2E対応 |
|----------|------|--------|--------|---------|
| TC-DECK-001 | デッキ作成 | ✅ | - | ✅ |
| TC-DECK-002 | デッキ編集 | ✅ | - | ✅ |
| TC-DECK-003 | デッキ削除 | ✅ | - | ✅ |
| TC-DECK-004 | デッキ削除（制約） | - | ✅ | ✅ |
| TC-DECK-005 | デッキ一覧 | ✅ | - | ✅ |
| TC-DECK-006 | デッキ名重複 | - | ✅ | ✅ |
| TC-DECK-007 | デッキ検索 | ✅ | - | ✅ |

## テスト実行順序の推奨

1. TC-DECK-001（デッキ作成） - テストデータを作成
2. TC-DECK-005（デッキ一覧） - 作成したデッキが表示されることを確認
3. TC-DECK-007（デッキ検索） - 検索機能の確認
4. TC-DECK-002（デッキ編集） - 編集機能の確認
5. TC-DECK-006（デッキ名重複） - バリデーションの確認
6. TC-DECK-004（デッキ削除制約） - 対戦記録がある場合の削除拒否を確認
7. TC-DECK-003（デッキ削除） - 対戦記録がないデッキの削除を確認
