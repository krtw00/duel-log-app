---
depends_on: []
tags: [guide, testing]
ai_summary: "テスト実行方法とテスト戦略"
---

# テストガイド

> Status: Active
> 最終更新: 2026-01-23

テスト実行方法とテスト戦略を記載する。

---

## テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest | 関数、フック、サービス |
| コンポーネントテスト | Testing Library | Reactコンポーネント |
| 統合テスト | Vitest + MSW | API連携 |
| E2Eテスト | Playwright | ユーザーフロー |

---

## テスト実行

```bash
# 全テスト
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ付き
pnpm test:coverage

# フロントエンドのみ
pnpm --filter web test

# バックエンドのみ
pnpm --filter api test

# E2Eテスト
pnpm test:e2e
```

---

## カバレッジ要件

| 対象 | 最小カバレッジ |
|------|---------------|
| サービス層 | 90% |
| フック | 80% |
| コンポーネント | 70% |
| ユーティリティ | 90% |

---

## テストの書き方

### 命名規則

| パターン | 形式 |
|---------|------|
| ファイル名 | `*.test.ts` / `*.spec.ts` |
| describeブロック | 対象の名前（関数名、コンポーネント名） |
| itブロック | `should + 期待する動作` |

### テスト構造（AAA パターン）

| フェーズ | 内容 |
|---------|------|
| Arrange | テストデータとモックの準備 |
| Act | テスト対象の実行 |
| Assert | 結果の検証 |

---

## 関連ドキュメント

- [contributing.md](../07-development/contributing.md) - コントリビューションガイド
- [ci-cd.md](../06-deployment/ci-cd.md) - CI/CD設定
