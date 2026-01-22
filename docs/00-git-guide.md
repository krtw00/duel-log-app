---
depends_on: [./00-writing-guide.md]
tags: [governance, git, workflow]
ai_summary: "コミットメッセージ・ブランチ命名・変更履歴管理のGit規範"
---

# Git規範

> Status: Active
> 最終更新: 2026-01-23

Git操作に関する規範を定義する。コミットメッセージ、ブランチ命名、変更履歴の管理方法を統一する。

---

## コミットメッセージ

### Conventional Commits

[Conventional Commits](https://www.conventionalcommits.org/) に準拠する。

```
<type>(<scope>): <subject>

<body>

<footer>
```

### type 一覧

| type | 用途 | CHANGELOG対象 |
|------|------|:------------:|
| `feat` | 新機能追加 | ✅ |
| `fix` | バグ修正 | ✅ |
| `docs` | ドキュメントのみの変更 | - |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） | - |
| `refactor` | バグ修正でも機能追加でもないコード変更 | - |
| `perf` | パフォーマンス改善 | ✅ |
| `test` | テストの追加・修正 | - |
| `build` | ビルドシステム・外部依存の変更 | - |
| `ci` | CI設定の変更 | - |
| `chore` | その他の変更（src・testに影響しない） | - |

### scope

変更対象を示す。省略可。

| scope | 対象 |
|-------|------|
| `frontend` | フロントエンド全般 |
| `backend` | バックエンド全般 |
| `db` | データベース・マイグレーション |
| `auth` | 認証関連 |
| `docs` | ドキュメント |
| `deps` | 依存関係 |

### subject ルール

- 命令形で記述する（「追加した」ではなく「追加」）
- 何のために変えたかを優先する（「ボタン色変更」より「視認性向上のためボタン色変更」）
- 50文字以内
- 末尾にピリオドを付けない
- 日本語可

### 破壊的変更

`BREAKING CHANGE:` をフッターに記載する。または type/scope の後に `!` を付与する。

```
feat(api)!: レスポンス形式をJSON:API準拠に変更

BREAKING CHANGE: レスポンスのdata構造が変更
```

---

## コミット粒度

1コミット = 1論理変更とする。以下の基準に従う：

- **動作する状態**で区切る。ビルドエラーやテスト失敗の状態でコミットしない
- **レビュー単位**を意識する。1コミットで差分が把握できるサイズに保つ
- **リバート可能**にする。独立した変更を1つのコミットに混ぜない

### 良い例・悪い例

| 判定 | コミット | 理由 |
|:----:|---------|------|
| ✅ | `feat(auth): ログアウトボタン追加` | 1機能が完結 |
| ✅ | `fix(db): N+1クエリ解消` | 1つの問題修正 |
| ❌ | `feat: ログアウトとプロフィール画面追加` | 2機能が混在 |
| ❌ | `fix: バグ修正` | 何を修正したか不明 |
| ❌ | `WIP` | 動作しない状態 |

---

## ブランチ命名

### 形式

```
<type>/<short-description>
```

### type 一覧

| type | 用途 | 例 |
|------|------|-----|
| `feature` | 新機能 | `feature/deck-statistics` |
| `fix` | バグ修正 | `fix/login-redirect` |
| `docs` | ドキュメント | `docs/api-reference` |
| `refactor` | リファクタリング | `refactor/auth-flow` |
| `chore` | その他 | `chore/update-deps` |

### ルール

- 英語ケバブケースを使用する
- 30文字以内に収める
- Issue番号がある場合は末尾に付与する（例: `feature/deck-stats-123`）

---

## 変更履歴（CHANGELOG）

### 基本方針

- 通常の変更 → Git履歴で管理する
- リリース単位の重要変更 → `CHANGELOG.md` に記録する

### CHANGELOGに記録する変更

| 対象 | 例 |
|------|-----|
| 新機能 | ユーザー向けの新しい機能追加 |
| 破壊的変更 | APIの互換性を壊す変更 |
| 重要なバグ修正 | データ損失やセキュリティに関わる修正 |
| 非推奨化 | 機能の非推奨宣言 |

### 形式

[Keep a Changelog](https://keepachangelog.com/) に準拠する。

```markdown
## [バージョン] - YYYY-MM-DD

### Added
- 新機能の説明

### Changed
- 変更内容の説明

### Fixed
- 修正内容の説明
```

---

## 関連ドキュメント

- [00-writing-guide.md](./00-writing-guide.md) - 文章品質・用語に関する記載規範
- [00-format-guide.md](./00-format-guide.md) - 構造・分量・メタ情報のフォーマット規範
- [07-development/contributing.md](./07-development/contributing.md) - コントリビューションガイドライン
