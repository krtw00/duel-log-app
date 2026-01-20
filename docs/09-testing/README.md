# 09-testing - テスト

このセクションでは、テスト方法とテストケースを説明します。

## ドキュメント一覧

| ファイル/ディレクトリ | 説明 |
|---------------------|------|
| [e2e-test-guide.md](./e2e-test-guide.md) | E2Eテストガイド（agent-browser使用） |
| [test-cases/](./test-cases/) | テストケース定義 |
| [reports/](./reports/) | テストレポート |

## テストケース

| ファイル | 対象機能 |
|---------|---------|
| [test-cases/auth-flow.md](./test-cases/auth-flow.md) | 認証フロー |
| [test-cases/e2e-auth.md](./test-cases/e2e-auth.md) | E2E認証テスト |
| [test-cases/e2e-decks.md](./test-cases/e2e-decks.md) | E2Eデッキ管理テスト |
| [test-cases/e2e-duels.md](./test-cases/e2e-duels.md) | E2E対戦記録テスト |
| [test-cases/e2e-statistics.md](./test-cases/e2e-statistics.md) | E2E統計テスト |

## このセクションを読むべき人

- テスト担当者
- E2Eテストを実行する開発者
- 新機能のテストケースを作成する人

## テスト実行方法

```bash
# バックエンドテスト
cd backend && uv run pytest

# フロントエンドテスト
cd frontend && npm run test

# E2Eテスト（agent-browser使用）
# 詳細は e2e-test-guide.md を参照
```

## 次に読むべきドキュメント

- @../08-development/local-development.md - 開発環境セットアップ
