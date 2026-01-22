---
depends_on: []
tags: [development, environment]
ai_summary: "開発環境の詳細な構築手順"
---

# 開発環境セットアップ（詳細）

> Status: Active
> 最終更新: 2026-01-23

開発環境の詳細な設定と構成

---

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | 開発環境セットアップの詳細ガイド |
| 対象読者 | 開発者 |
| 関連 | [クイックスタート](../05-guides/quickstart.md) |

---

## 前提条件

| 要件 | バージョン | インストール |
|------|-----------|-------------|
| Node.js | 20+ | `nvm install 20` |
| pnpm | 8+ | `npm install -g pnpm` |
| Docker Desktop | 最新版 | [公式サイト](https://www.docker.com/products/docker-desktop/) |

---

## ローカル開発（推奨）

### 1. リポジトリクローン

```bash
git clone https://github.com/krtw00/duel-log-app.git
cd duel-log-app
```

### 2. 依存関係インストール

```bash
pnpm install
```

### 3. ローカルSupabase起動

```bash
npx supabase start
```

起動後に表示される情報：

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOiJIUzI1NiIs...
service_role key: eyJhbGciOiJIUzI1NiIs...
```

### 4. 環境変数設定

```bash
cp .env.example .env
```

`.env`を編集：

```bash
# Supabase（ローカル）
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<起動時に表示されたanon key>
SUPABASE_SERVICE_ROLE_KEY=<起動時に表示されたservice_role key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 5. データベースセットアップ

```bash
# マイグレーション実行
pnpm db:migrate

# シードデータ投入
pnpm db:seed
```

### 6. 開発サーバー起動

```bash
pnpm dev
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| API | http://localhost:5173/api |
| Supabase Studio | http://127.0.0.1:54323 |

---

## Docker環境

Docker Composeを使用する場合（旧構成との互換性）：

```bash
# Supabase起動
npx supabase start

# Docker Compose起動
docker compose up -d
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンドAPI | http://localhost:8000 |

---

## IDEセットアップ

### VSCode推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "prisma.prisma"
  ]
}
```

### VSCode設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## モノレポ構造

```
duel-log-app/
├── apps/
│   └── web/                # フロントエンド
├── packages/
│   ├── api/                # バックエンド
│   └── shared/             # 共有コード
├── pnpm-workspace.yaml     # ワークスペース定義
└── package.json            # ルートpackage.json
```

### ワークスペースコマンド

```bash
# 特定のパッケージでコマンド実行
pnpm --filter web <command>
pnpm --filter api <command>
pnpm --filter shared <command>

# 例
pnpm --filter web dev
pnpm --filter api test
```

---

## 環境変数

### フロントエンド（VITE_プレフィックス）

| 変数 | 説明 | 必須 |
|------|------|:----:|
| `VITE_SUPABASE_URL` | Supabase URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |

### バックエンド

| 変数 | 説明 | 必須 |
|------|------|:----:|
| `DATABASE_URL` | PostgreSQL接続文字列 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |

---

## Git Hooks

Huskyによるpre-commitフック：

```bash
# 自動設定
pnpm prepare

# 手動設定
npx husky install
```

実行されるチェック：

1. ESLint
2. Prettier
3. 型チェック
4. テスト（該当ファイルのみ）

---

## データベース操作

### マイグレーション

```bash
# マイグレーション生成
pnpm db:generate

# マイグレーション適用
pnpm db:migrate

# マイグレーションリセット
pnpm db:reset
```

### シードデータ

```bash
# シードデータ投入
pnpm db:seed
```

### Drizzle Studio

```bash
# GUIでDBを操作
pnpm db:studio
```

---

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | ビルド |
| `pnpm test` | テスト実行 |
| `pnpm lint` | リント |
| `pnpm typecheck` | 型チェック |
| `pnpm format` | フォーマット |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [クイックスタート](../05-guides/quickstart.md) | クイックスタート |
| [コントリビューションガイド](./contributing.md) | コントリビューションガイド |
| [トラブルシューティング](../05-guides/troubleshooting.md) | トラブルシューティング |
