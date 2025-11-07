# バグトラッキングシステム セットアップガイド

このガイドでは、GitHub Issues と Projects を使った日本語バグトラッキングシステムのセットアップ方法を説明します。

## 📋 目次

1. [GitHub Project の作成](#1-github-project-の作成)
2. [Personal Access Token (PAT) の作成](#2-personal-access-token-pat-の作成)
3. [リポジトリへのシークレット登録](#3-リポジトリへのシークレット登録)
4. [ワークフロー設定の更新](#4-ワークフロー設定の更新)
5. [バグ報告の方法（非エンジニア向け）](#5-バグ報告の方法非エンジニア向け)

---

## 1. GitHub Project の作成

### 手順

1. GitHubリポジトリページにアクセス
2. 上部のタブから **「Projects」** をクリック
3. **「New project」** ボタンをクリック
4. テンプレートから **「Board」** または **「Table」** を選択（おすすめ: Board）
5. プロジェクト名を入力（例: 「バグ管理」）
6. **「Create project」** をクリック

### プロジェクトURLの確認

作成したプロジェクトのURLをメモしてください。形式は以下のようになります：

```
https://github.com/users/YOUR_USERNAME/projects/PROJECT_NUMBER
```

または（組織の場合）:

```
https://github.com/orgs/ORG_NAME/projects/PROJECT_NUMBER
```

---

## 2. Personal Access Token (PAT) の作成

GitHub Actions が Project にアクセスするための認証トークンを作成します。

### 手順

1. GitHubの右上のアイコンをクリックし、**「Settings」** を選択
2. 左サイドバーの一番下の **「Developer settings」** をクリック
3. **「Personal access tokens」** → **「Tokens (classic)」** を選択
4. **「Generate new token」** → **「Generate new token (classic)」** をクリック
5. 以下の情報を入力：
   - **Note（メモ）**: `Project Auto-add Token` など、わかりやすい名前
   - **Expiration（有効期限）**: 任意（推奨: 90日または無期限）
   - **Select scopes（権限）**: 以下をチェック
     - ✅ `project` (read/write)
     - ✅ `repo` (full control)
6. ページ下部の **「Generate token」** をクリック
7. 表示されたトークンをコピー（**このページを閉じると二度と見られません！**）

> ⚠️ **重要**: トークンは安全な場所に保管してください。他の人に共有しないでください。

---

## 3. リポジトリへのシークレット登録

作成したトークンをリポジトリに登録します。

### 手順

1. GitHubリポジトリページにアクセス
2. **「Settings」** タブをクリック
3. 左サイドバーの **「Secrets and variables」** → **「Actions」** を選択
4. **「New repository secret」** ボタンをクリック
5. 以下の情報を入力：
   - **Name**: `PROJECT_TOKEN`
   - **Secret**: 先ほどコピーしたトークンを貼り付け
6. **「Add secret」** をクリック

---

## 4. ワークフロー設定の更新

`.github/workflows/add-to-project.yml` ファイルを編集します。

### 手順

1. `.github/workflows/add-to-project.yml` を開く
2. 以下の行を編集：

```yaml
project-url: https://github.com/users/YOUR_USERNAME/projects/YOUR_PROJECT_NUMBER
```

を、手順1でメモしたプロジェクトのURLに変更します。

例：
```yaml
project-url: https://github.com/users/krtw00/projects/1
```

3. ファイルを保存してコミット

```bash
git add .github/workflows/add-to-project.yml
git commit -m "chore: GitHub Project URL を設定"
git push
```

---

## 5. バグ報告の方法（非エンジニア向け）

### バグ報告手順

1. GitHubリポジトリページにアクセス
2. **「Issues」** タブをクリック
3. **「New issue」** ボタンをクリック
4. **「バグ報告」** を選択
5. フォームに以下の情報を入力：

#### 必須項目

- **バグのカテゴリ**: プルダウンから選択
  - ログイン・認証
  - デッキ管理
  - 対戦記録の登録
  - 統計情報の表示
  - OBS配信オーバーレイ
  - プロフィール設定
  - CSVインポート/エクスポート
  - その他

- **重要度**: バグの深刻さを選択
  - 高 - アプリが使えない
  - 中 - 一部の機能が使えない
  - 低 - 使えるが不便

- **バグの内容**: 問題の詳細を記入
  ```
  例: ログインボタンを押しても何も反応しない
  ```

- **再現手順**: バグが発生する手順を記入
  ```
  1. ログインページを開く
  2. メールアドレスとパスワードを入力
  3. ログインボタンをクリック
  4. 何も起こらない
  ```

#### 任意項目

- **期待される動作**: 本来どう動くべきか
- **使用ブラウザ**: Chrome、Edge、Firefoxなど
- **使用デバイス**: Windows PC、Mac、スマートフォンなど
- **スクリーンショット**: 画像をドラッグ&ドロップ
- **補足情報**: その他参考情報

6. **「Submit new issue」** をクリック

### 自動処理

バグ報告を送信すると、自動的に以下が実行されます：

1. ✅ Issue が作成される
2. ✅ 自動的に GitHub Project に追加される
3. ✅ `bug` ラベルが付与される

---

## 📊 Project での管理方法

### ステータス管理

Project ボードで Issue のステータスを管理できます：

- **Todo**: 未着手
- **In Progress**: 対応中
- **Done**: 完了

Issue をドラッグ&ドロップで移動できます。

### フィルタリング

Project では以下でフィルタリング可能：

- ラベル（`bug`、`high priority` など）
- 担当者
- ステータス
- 作成日

### 優先度の設定

Issue に以下のラベルを追加することで優先度を管理：

- `priority: high` - 高優先度
- `priority: medium` - 中優先度
- `priority: low` - 低優先度

---

## 🔧 トラブルシューティング

### ワークフローが動作しない

1. Actions タブで実行ログを確認
2. `PROJECT_TOKEN` が正しく登録されているか確認
3. トークンの権限が `project` と `repo` を含んでいるか確認
4. プロジェクトURLが正しいか確認

### Issueが自動追加されない

- GitHub Actions の実行権限を確認
  - Settings → Actions → General → Workflow permissions
  - 「Read and write permissions」が有効か確認

---

## 📚 参考リンク

- [GitHub Issues 公式ドキュメント](https://docs.github.com/ja/issues)
- [GitHub Projects 公式ドキュメント](https://docs.github.com/ja/issues/planning-and-tracking-with-projects)
- [GitHub Actions 公式ドキュメント](https://docs.github.com/ja/actions)
