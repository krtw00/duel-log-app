# テスト

テスト方法とテストケース。

---

## ドキュメント一覧

| ファイル | 説明 |
|---------|------|
| @./e2e-test-guide.md | E2Eテストガイド（agent-browser使用） |
| `test-cases/` | テストケース定義 |

---

## テストケース

| ファイル | 対象機能 |
|---------|---------|
| @./test-cases/auth-flow.md | 認証フロー |
| @./test-cases/e2e-auth.md | E2E認証テスト |
| @./test-cases/e2e-decks.md | E2Eデッキ管理テスト |
| @./test-cases/e2e-duels.md | E2E対戦記録テスト |
| @./test-cases/e2e-statistics.md | E2E統計テスト |

---

## テスト実行

```bash
# バックエンドテスト
cd backend && uv run pytest

# フロントエンドテスト
cd frontend && npm run test

# E2Eテスト（agent-browser使用）
# 詳細は e2e-test-guide.md を参照
```

---

## 対象読者

| 状況 | 推奨 |
|------|------|
| テスト担当者 | @./e2e-test-guide.md |
| E2E実行 | @./e2e-test-guide.md |
| テストケース作成 | `test-cases/` |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| @../08-development/local-development.md | 開発環境セットアップ |
