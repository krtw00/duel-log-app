# 認証フロー E2Eテストケース

## 概要
ユーザー認証機能（ログイン、ログアウト、新規登録）のE2Eテストケース。
agent-browserを使用してUIレベルでの動作確認を行う。

---

## TC-AUTH-001: 正常なログイン

### 目的
登録済みユーザーが正しい認証情報でログインできることを確認する。

### 前提条件
- テストユーザーが登録済み（test@example.com / password123）
- ログアウト状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ログインページを開く | ログインフォームが表示される |
| 2 | メールアドレスを入力 | 入力値が反映される |
| 3 | パスワードを入力 | 入力値が反映される（マスク表示） |
| 4 | ログインボタンをクリック | ダッシュボードにリダイレクトされる |
| 5 | ダッシュボードの内容を確認 | ユーザー名が表示される |

### agent-browser コマンド

```bash
# ログインページを開く
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i

# メールアドレスを入力
agent-browser fill @email-input "test@example.com"

# パスワードを入力
agent-browser fill @password-input "password123"

# ログインボタンをクリック
agent-browser click @login-button

# 遷移後の画面を確認
agent-browser snapshot
# 期待: URLが /dashboard に変わっている
# 期待: ユーザー名が表示されている

agent-browser screenshot
```

### 備考
- Cookieベースの認証が正しく動作することを確認
- リダイレクト後にトークンが保存されていることを確認

---

## TC-AUTH-002: 誤った認証情報でのログイン（異常系）

### 目的
誤ったパスワードでログインを試みた際、適切なエラーメッセージが表示されることを確認する。

### 前提条件
- ログアウト状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ログインページを開く | ログインフォームが表示される |
| 2 | メールアドレスを入力 | 入力値が反映される |
| 3 | 誤ったパスワードを入力 | 入力値が反映される |
| 4 | ログインボタンをクリック | エラーメッセージが表示される |
| 5 | エラーメッセージの内容を確認 | 「メールアドレスまたはパスワードが正しくありません」と表示される |

### agent-browser コマンド

```bash
# ログインページを開く
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i

# メールアドレスを入力
agent-browser fill @email-input "test@example.com"

# 誤ったパスワードを入力
agent-browser fill @password-input "wrong-password"

# ログインボタンをクリック
agent-browser click @login-button

# エラーメッセージを確認
agent-browser snapshot
# 期待: エラーメッセージが表示されている
# 期待: ログインページに留まっている

agent-browser screenshot
```

### 備考
- エラーメッセージが日本語で表示されることを確認
- セキュリティのため、メールアドレスの存在有無を明示しないこと

---

## TC-AUTH-003: 新規ユーザー登録

### 目的
新規ユーザーが正しく登録できることを確認する。

### 前提条件
- ログアウト状態である
- テストメールアドレスが未登録（newuser@example.com）

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 登録ページを開く | 登録フォームが表示される |
| 2 | メールアドレスを入力 | 入力値が反映される |
| 3 | パスワードを入力 | 入力値が反映される（マスク表示） |
| 4 | パスワード確認を入力 | 入力値が反映される（マスク表示） |
| 5 | 登録ボタンをクリック | ダッシュボードにリダイレクトされる |
| 6 | ダッシュボードの内容を確認 | ユーザー名が表示される |

### agent-browser コマンド

```bash
# 登録ページを開く
agent-browser open "http://localhost:5173/register"
agent-browser snapshot -i

# メールアドレスを入力
agent-browser fill @email-input "newuser@example.com"

# パスワードを入力
agent-browser fill @password-input "newpassword123"

# パスワード確認を入力
agent-browser fill @password-confirm-input "newpassword123"

# 登録ボタンをクリック
agent-browser click @register-button

# 遷移後の画面を確認
agent-browser snapshot
# 期待: URLが /dashboard に変わっている
# 期待: ユーザー名が表示されている

agent-browser screenshot
```

### 備考
- Supabase Authによる登録が正しく動作することを確認
- 登録後に自動ログインされることを確認

---

## TC-AUTH-004: パスワード不一致での登録（異常系）

### 目的
パスワードと確認用パスワードが一致しない場合、適切なエラーメッセージが表示されることを確認する。

### 前提条件
- ログアウト状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 登録ページを開く | 登録フォームが表示される |
| 2 | メールアドレスを入力 | 入力値が反映される |
| 3 | パスワードを入力 | 入力値が反映される |
| 4 | 異なるパスワード確認を入力 | 入力値が反映される |
| 5 | 登録ボタンをクリック | エラーメッセージが表示される |

### agent-browser コマンド

```bash
# 登録ページを開く
agent-browser open "http://localhost:5173/register"
agent-browser snapshot -i

# メールアドレスを入力
agent-browser fill @email-input "another@example.com"

# パスワードを入力
agent-browser fill @password-input "password123"

# 異なるパスワード確認を入力
agent-browser fill @password-confirm-input "password456"

# 登録ボタンをクリック
agent-browser click @register-button

# エラーメッセージを確認
agent-browser snapshot
# 期待: 「パスワードが一致しません」というエラーが表示される
# 期待: 登録ページに留まっている

agent-browser screenshot
```

### 備考
- クライアント側のバリデーションが動作することを確認

---

## TC-AUTH-005: ログアウト

### 目的
ログイン済みユーザーが正しくログアウトできることを確認する。

### 前提条件
- ログイン済み状態である
- ダッシュボードを表示している

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ダッシュボードを開く | ダッシュボードが表示される |
| 2 | ユーザーメニューを開く | メニューが展開される |
| 3 | ログアウトボタンをクリック | ログインページにリダイレクトされる |
| 4 | ログインページを確認 | ログインフォームが表示される |
| 5 | ダッシュボードに直接アクセス | ログインページにリダイレクトされる |

### agent-browser コマンド

```bash
# まずログインする
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i
agent-browser fill @email-input "test@example.com"
agent-browser fill @password-input "password123"
agent-browser click @login-button

# ダッシュボードでユーザーメニューを開く
agent-browser snapshot -i
agent-browser click @user-menu-button

# ログアウトボタンをクリック
agent-browser snapshot -i
agent-browser click @logout-button

# ログアウト後の画面を確認
agent-browser snapshot
# 期待: URLが /login に変わっている
# 期待: ログインフォームが表示されている

# 認証が必要なページに直接アクセスを試みる
agent-browser open "http://localhost:5173/dashboard"
agent-browser snapshot
# 期待: /login にリダイレクトされる

agent-browser screenshot
```

### 備考
- Cookieが削除されることを確認
- 認証ガードが正しく動作することを確認

---

## TC-AUTH-006: ログインページから登録ページへの遷移

### 目的
ログインページから登録ページへのナビゲーションが正しく動作することを確認する。

### 前提条件
- ログアウト状態である

### テスト手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | ログインページを開く | ログインフォームが表示される |
| 2 | 「アカウントを作成」リンクをクリック | 登録ページに遷移する |
| 3 | 登録ページを確認 | 登録フォームが表示される |

### agent-browser コマンド

```bash
# ログインページを開く
agent-browser open "http://localhost:5173/login"
agent-browser snapshot -i

# 登録ページへのリンクをクリック
agent-browser click @register-link

# 登録ページを確認
agent-browser snapshot
# 期待: URLが /register に変わっている
# 期待: 登録フォームが表示されている

agent-browser screenshot
```

### 備考
- ユーザビリティの観点から、ページ間の遷移がスムーズであることを確認

---

## カバレッジ

| テストID | 機能 | 正常系 | 異常系 | E2E対応 |
|----------|------|--------|--------|---------|
| TC-AUTH-001 | ログイン | ✅ | - | ✅ |
| TC-AUTH-002 | ログイン | - | ✅ | ✅ |
| TC-AUTH-003 | 新規登録 | ✅ | - | ✅ |
| TC-AUTH-004 | 新規登録 | - | ✅ | ✅ |
| TC-AUTH-005 | ログアウト | ✅ | - | ✅ |
| TC-AUTH-006 | ページ遷移 | ✅ | - | ✅ |

## テスト実行順序の推奨

1. TC-AUTH-003（新規登録） - テストユーザーを作成
2. TC-AUTH-001（正常ログイン） - 作成したユーザーでログイン確認
3. TC-AUTH-005（ログアウト） - ログアウト確認
4. TC-AUTH-002（異常ログイン） - エラーハンドリング確認
5. TC-AUTH-004（異常登録） - バリデーション確認
6. TC-AUTH-006（ページ遷移） - ナビゲーション確認
