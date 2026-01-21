# フィードバック・連絡先機能設計

アプリ内からバグ報告・機能要望を送信し、開発者への連絡手段を提供。

> **❌ 未実装:** 計画中機能

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| バグ報告 | GitHub Issues自動作成 |
| 機能要望 | GitHub Issues自動作成 |
| 連絡先表示 | メール、SNSリンク |

---

## UI設計

### ヘルプメニュー配置

```
AppBar → [❓] ヘルプメニュー
```

### メニュー構成

| 項目 | アイコン |
|------|---------|
| バグを報告 | 🐛 |
| 機能をリクエスト | 💡 |
| お問い合わせ | 📧 |
| Twitter/X | 🐦 |
| バージョン情報 | ℹ️ |

---

## 技術設計

### GitHub Issues連携

```
ユーザー → フロントエンド → バックエンドAPI → GitHub API → Issue作成
```

| 採用理由 | 説明 |
|---------|------|
| トークン保護 | PATをフロントエンドに露出させない |
| レート制限管理 | サーバー側で制御 |
| スパム対策 | 認証ユーザーのみ送信可能 |

---

## API

| エンドポイント | 説明 |
|---------------|------|
| `GET /api/feedback/status` | 機能状態取得 |
| `POST /api/feedback/bug` | バグ報告 |
| `POST /api/feedback/enhancement` | 機能要望 |
| `POST /api/feedback/contact` | お問い合わせ |

### リクエスト例

```json
{
  "title": "タイトル",
  "description": "説明",
  "steps": "再現手順（任意）"
}
```

### レスポンス

```json
{
  "success": true,
  "message": "バグ報告を送信しました",
  "issue_url": "https://github.com/owner/repo/issues/123"
}
```

---

## セキュリティ

| 項目 | 対策 |
|------|------|
| プライバシー | 個人情報はIssueに含めない |
| 認証 | ログインユーザーのみ送信可 |
| レート制限 | スパム防止（1分5件、1日20件） |
| 入力検証 | サニタイズ、長さ制限 |

---

## 環境変数

| 変数 | 説明 |
|------|------|
| `GITHUB_TOKEN` | Personal Access Token |
| `GITHUB_REPO_OWNER` | リポジトリオーナー |
| `GITHUB_REPO_NAME` | リポジトリ名 |
| `FEEDBACK_ENABLED` | 機能有効化フラグ |
| `CONTACT_EMAIL` | 連絡先メール |
| `X_HANDLE` | Twitter/Xハンドル |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../02-architecture/backend-architecture.md | バックエンド構造 |
| @../02-architecture/frontend-architecture.md | フロントエンド構造 |
