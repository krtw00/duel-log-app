---
depends_on: []
tags: [guide, setup]
ai_summary: "最短での開発環境セットアップ手順"
---

# クイックスタート

> Status: Active
> 最終更新: 2026-01-23

最短で開発環境をセットアップし、動作確認する手順を記載する。

---

## 前提条件

| 要件 | バージョン | 確認コマンド |
|------|-----------|-------------|
| Node.js | 20+ | `node -v` |
| pnpm | 8+ | `pnpm -v` |
| Docker Desktop | 最新版 | `docker -v` |

---

## セットアップ手順

### 1. リポジトリクローン

```bash
git clone https://github.com/krtw00/duel-log-app.git
cd duel-log-app
```

### 2. 依存関係インストール

```bash
pnpm install
```

### 3. Supabase起動（認証・DB）

```bash
npx supabase start
```

起動後に表示される情報：

| 項目 | 説明 |
|------|------|
| API URL | `http://127.0.0.1:54321` |
| anon key | 環境変数に設定 |
| Studio URL | `http://127.0.0.1:54323` |

### 4. 環境変数設定

```bash
cp .env.example .env
```

### 5. 開発サーバー起動

```bash
pnpm dev
```

### 6. 動作確認

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| API | http://localhost:5173/api |
| Supabase Studio | http://127.0.0.1:54323 |

---

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド |
| `pnpm test` | ユニットテスト |
| `pnpm test:e2e` | E2Eテスト |
| `pnpm typecheck` | 型チェック |
| `pnpm lint` | リント |
| `pnpm db:seed` | シードデータ投入 |

---

## テストユーザー

シードスクリプトで作成（パスワード: `password123`）：

| ユーザー | メール | 管理者 | デバッガー |
|---------|--------|:------:|:---------:|
| testuser | test@example.com | ✅ | ✅ |
| admin | admin@example.com | ✅ | - |
| debugger | debugger@example.com | - | ✅ |

---

## トラブルシューティング

問題が発生した場合は [troubleshooting.md](./troubleshooting.md) を参照。

---

## 関連ドキュメント

- [summary.md](../01-overview/summary.md) - プロジェクト概要
- [environment-setup.md](../07-development/environment-setup.md) - 詳細な環境設定
- [troubleshooting.md](./troubleshooting.md) - トラブルシューティング
