# デプロイ手順書

このドキュメントは、Duel Log AppのVercelおよびRenderへのデプロイ手順について記述します。

---

## 概要

本アプリケーションは、以下の構成でホスティングされています。

- **フロントエンド**: Vercel
- **バックエンド**: Render
- **データベース**: Neon (PostgreSQL)

CI/CDはGitHub Actionsを利用しており、`main`ブランチへのプッシュをトリガーとして、自動的にテストとデプロイが実行されます。

---

## フロントエンド (Vercel)

### 1. Vercelプロジェクトの作成

1. Vercelにログインし、新しいプロジェクトを作成します。
2. "Import Git Repository"から、本プロジェクトのGitHubリポジトリを選択します。

### 2. プロジェクトの設定

- **Framework Preset**: `Vite`を選択します。
- **Root Directory**: `frontend`を選択します。
- **Build and Output Settings**: 基本的に自動で設定されますが、必要に応じて調整します。
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

### 3. 環境変数の設定

プロジェクト設定の"Environment Variables"で、以下の環境変数を設定します。

| 名前 | 値 | 説明 |
| :--- | :--- | :--- |
| `VITE_API_URL` | バックエンドAPIのURL (例: `https://your-backend-app.onrender.com`) | バックエンドAPIのエンドポイント |

### 4. デプロイ

上記設定後、"Deploy"ボタンをクリックするとデプロイが開始されます。
`main`ブランチにプッシュされるたびに、Vercelが自動的に新しいバージョンをビルド・デプロイします。

---

## バックエンド (Render)

### 1. Renderプロジェクトの作成

1. Renderにログインし、"New +"から"Web Service"を選択します。
2. 本プロジェクトのGitHubリポジトリを接続します。

### 2. プロジェクトの設定

- **Name**: サービス名（例: `duel-log-app-backend`）
- **Root Directory**: `backend`
- **Environment**: `Docker`
- **Region**: 任意のリージョン（例: `Tokyo`）
- **Branch**: `main`
- **Start Command**: Dockerfileで定義されたコマンドが実行されます。`start.py`スクリプトがデータベース接続の待機、マイグレーション実行、Uvicornサーバー起動を自動的に処理します。

### 3. 環境変数の設定

プロジェクト設定の"Environment"で、以下の環境変数を設定します。

| 名前 | 値 | 説明 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neonから提供されるPostgreSQL接続URL | データベース接続情報 |
| `SECRET_KEY` | `openssl rand -hex 32`などで生成した秘密鍵 | JWTの署名に使用する秘密鍵 |
| `ENVIRONMENT` | `production` | 本番環境であることを示すフラグ |
| `FRONTEND_URL` | フロントエンドのURL (例: `https://your-frontend-app.vercel.app`) | CORS設定やメールで使用 |

### 4. データベース (Neon)

1. Neonで新しいプロジェクトを作成し、PostgreSQLデータベースを作成します。
2. 接続情報（Connection String）を取得し、Renderの`DATABASE_URL`環境変数に設定します。

### 5. デプロイ

"Create Web Service"をクリックすると、初回デプロイが開始されます。
`main`ブランチにプッシュされるたびに、Renderが自動的に新しいバージョンをビルド・デプロイします。

---

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml`で定義されています。

`main`ブランチへのプッシュ時に、以下の処理が自動的に実行されます。

1. **バックエンドのテスト**: `pytest`を使用してバックエンドの単体テストを実行します。
2. **フロントエンドのビルド**: `npm run build`を使用してフロントエンドのビルドが成功することを確認します。

テストがすべて成功した場合のみ、VercelとRenderの自動デプロイが実行される構成になっています。
