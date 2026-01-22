---
depends_on: []
tags: [development, contributing]
ai_summary: "コントリビューションガイドライン"
---

# コントリビューションガイド

> Status: Active
> 最終更新: 2026-01-23

Git運用、コーディング規約、プルリクエスト

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | コントリビューションルールのSSoT |
| 対象読者 | 開発者 |

---

## ブランチ戦略

### ブランチ命名規則

| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feature/` | 新機能 | `feature/add-deck-filter` |
| `fix/` | バグ修正 | `fix/login-error` |
| `refactor/` | リファクタリング | `refactor/statistics-service` |
| `docs/` | ドキュメント | `docs/update-readme` |
| `test/` | テスト追加 | `test/add-duel-tests` |
| `chore/` | その他 | `chore/update-deps` |

### ブランチフロー

```
main
 ├── develop
 │    ├── feature/xxx
 │    ├── fix/yyy
 │    └── ...
 │
 └── (hotfix/zzz) ← 緊急修正のみ
```

1. `develop`から作業ブランチを作成
2. 作業完了後、`develop`へPR
3. レビュー・マージ後、`develop` → `main`へリリース

---

## コミット規約

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ

| タイプ | 説明 |
|--------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（コードの意味に影響しない） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド、ツール設定等 |

### 例

```
feat(duel): add CSV export functionality

- Add export button to duel table
- Implement CSV generation service
- Add tests for CSV export

Closes #123
```

---

## コーディング規約

### TypeScript

| ルール | 説明 |
|-------|------|
| 明示的な型定義 | 関数の引数・戻り値に型を明示 |
| any禁止 | any型の使用を避ける |
| strictモード | tsconfig.jsonでstrict: true |

### React

| ルール | 説明 |
|-------|------|
| 関数コンポーネント | クラスコンポーネントは使用しない |
| Props型定義 | interfaceで明示的に定義 |
| フック使用 | useState, useEffect等を活用 |

### ファイル命名

| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `DuelTable.tsx` |
| フック | camelCase | `useDuels.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |
| 定数 | camelCase | `constants.ts` |
| テスト | `*.test.ts` | `DuelTable.test.tsx` |

---

## プルリクエスト

### PRテンプレート

| セクション | 内容 |
|-----------|------|
| 概要 | 変更内容の簡潔な説明 |
| 変更点 | 箇条書きで変更をリスト |
| テスト | テスト追加・実行状況 |
| スクリーンショット | UIの変更がある場合 |
| 関連Issue | Closes #xxx |

### PRチェックリスト

- [ ] ブランチ名が規約に従っている
- [ ] コミットメッセージがConventional Commitsに従っている
- [ ] テストが追加/更新されている
- [ ] リントエラーがない
- [ ] 型エラーがない
- [ ] ドキュメントが更新されている（必要な場合）

---

## コードレビュー

### レビュアーへの指針

| 指針 | 説明 |
|------|------|
| 建設的なフィードバック | 改善点だけでなく、良い点も指摘 |
| 具体的な提案 | 「これは良くない」ではなく「こうすると良い」 |
| 迅速なレビュー | 24時間以内にレビュー開始 |

### レビュイーへの指針

| 指針 | 説明 |
|------|------|
| 小さなPR | 一つのPRは一つの機能/修正 |
| セルフレビュー | PR作成前に自分でレビュー |
| テスト付き | テストなしのPRは原則マージしない |

---

## リリースフロー

1. `develop`のテストがすべてパス
2. `develop` → `main`へPR作成
3. レビュー・承認
4. マージ → 自動デプロイ

### バージョニング

Semantic Versioning（SemVer）を採用：

| セグメント | 説明 |
|-----------|------|
| MAJOR | 破壊的変更 |
| MINOR | 後方互換性のある機能追加 |
| PATCH | 後方互換性のあるバグ修正 |

---

## 開発フロー例

```bash
# 1. developから最新を取得
git checkout develop
git pull origin develop

# 2. 作業ブランチ作成
git checkout -b feature/add-deck-filter

# 3. 作業・コミット
git add .
git commit -m "feat(deck): add archive toggle button"

# 4. プッシュ
git push origin feature/add-deck-filter

# 5. PRを作成（GitHub上）
```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [環境セットアップ](./environment-setup.md) | 環境セットアップ |
| [テストガイド](../05-guides/testing.md) | テストガイド |
