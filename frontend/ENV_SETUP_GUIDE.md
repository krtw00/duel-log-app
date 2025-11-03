# 環境変数設定ガイド

## 概要

このアプリケーションでは、環境ごとに異なる設定を環境変数で管理しています。

## 環境変数ファイル

### `.env.development`

開発環境で使用される環境変数です。`npm run dev` 実行時に自動的に読み込まれます。

```
VITE_API_URL=http://localhost:8000
```

### `.env.production`

本番環境で使用される環境変数です。`npm run build` 実行時に自動的に読み込まれます。

**重要**: 本番環境にデプロイする前に、このファイルの `VITE_API_URL` を実際の本番APIのURLに変更してください。

```
VITE_API_URL=https://your-production-api.com
```

### `.env.local` (オプション)

ローカル環境での個別設定に使用できます。このファイルは `.gitignore` に含まれているため、Git にコミットされません。

個人の開発環境に合わせた設定を行いたい場合は、`.env.example` をコピーして `.env.local` を作成してください。

```bash
cp .env.example .env.local
```

## 環境変数の優先順位

Viteは以下の優先順位で環境変数を読み込みます（上が優先）:

1. `.env.local` (すべての環境で読み込まれますが、Git には含まれません)
2. `.env.[mode].local` (指定されたモードでのみ読み込まれ、Git には含まれません)
3. `.env.[mode]` (指定されたモードでのみ読み込まれます)
4. `.env` (すべての環境で読み込まれます)

## 使用可能な環境変数

### VITE_API_URL

バックエンドAPIのベースURLを指定します。

- **開発環境**: `http://localhost:8000`
- **本番環境**: 本番APIのURL（例: `https://api.example.com`）

## 本番環境へのデプロイ手順

1. `.env.production` ファイルを編集し、`VITE_API_URL` を本番APIのURLに変更します。

```bash
# .env.production
VITE_API_URL=https://api.your-domain.com
```

2. 本番用ビルドを実行します。

```bash
npm run build
```

3. `dist` ディレクトリの内容を本番サーバーにデプロイします。

## 環境変数の追加方法

新しい環境変数を追加する場合:

1. 環境変数名は必ず `VITE_` で始める必要があります（Viteの仕様）
2. `.env.development` と `.env.production` の両方に追加します
3. `.env.example` にも追加して、他の開発者に通知します
4. TypeScriptの型定義を追加する場合は、`src/vite-env.d.ts` を作成または編集します

### TypeScript型定義の例

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // 他の環境変数を追加...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## トラブルシューティング

### 環境変数が反映されない

1. 開発サーバーを再起動してください

```bash
npm run dev
```

2. ブラウザのキャッシュをクリアしてください

### 本番ビルドで環境変数が反映されない

1. ビルドをクリーンアップしてから再ビルドしてください

```bash
rm -rf dist
npm run build
```

2. `.env.production` ファイルが正しく配置されているか確認してください
