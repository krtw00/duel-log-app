# プロジェクト引き継ぎガイド

## はじめに

このドキュメントは、Duel Log Appプロジェクトの運営を現在の管理者から新しい管理者へ引き継ぐための完全な手順書です。

### このドキュメントが必要な理由

このプロジェクトは以下の外部サービスに依存しています：

- **Supabase**: 認証およびデータベース
- **Vercel**: フロントエンドホスティング
- **Render**: バックエンドホスティング

特にSupabaseについては、**プロジェクトの所有権移転が困難**（Enterpriseプランのみ対応）であるため、新しい管理者は**新規にプロジェクトをセットアップ**する必要があります。

### 想定される引き継ぎシナリオ

1. **完全な引き継ぎ**: 既存ユーザーデータを含めて新環境へ移行
2. **新規スタート**: ユーザーデータを移行せず、コードベースのみ引き継ぐ

このガイドでは、**シナリオ1（完全な引き継ぎ）** を中心に解説します。

---

## 前提条件

### 必要なスキル

新しい管理者は以下のスキル・知識が必要です：

- **基本的なGit操作**: clone, pull, push, branch作成
- **ターミナル操作**: シェルスクリプトの実行、環境変数の設定
- **PostgreSQL基礎知識**: データのエクスポート/インポート
- **Webアプリケーションデプロイ経験**: VercelまたはRenderのどちらか

**所要時間の目安:**
- 経験豊富なエンジニア: 1-2日
- 初めての方: 3-5日

### 必要なアカウント

以下のサービスのアカウントを事前に作成してください：

1. **GitHub** - リポジトリのフォーク用
2. **Supabase** (無料プラン可) - 認証＋データベース
3. **Vercel** (無料プラン可) - フロントエンドホスティング
4. **Render** (無料プラン可) - バックエンドホスティング
5. **Google Cloud Console** (オプション) - Google OAuth用
6. **Discord Developer Portal** (オプション) - Discord OAuth用

### 必要なツール

ローカル環境に以下をインストールしてください：

- **Docker Desktop**: Supabase CLIで必要
- **Node.js**: v18以上（nvm推奨）
- **Python**: 3.11以上
- **PostgreSQL Client** (`psql`): データ操作用
- **Supabase CLI**: `npm install -g supabase`

---

## 引き継ぎ手順の全体像

```
【現在の管理者が実施】
Step 1: データのエクスポート
Step 2: リポジトリとドキュメントの最終確認

【新しい管理者が実施】
Step 3: リポジトリのフォーク
Step 4: 新規Supabaseプロジェクトのセットアップ
Step 5: データベーススキーマの構築
Step 6: データのインポート
Step 7: OAuth認証の設定
Step 8: バックエンドのデプロイ（Render）
Step 9: フロントエンドのデプロイ（Vercel）
Step 10: 動作確認
Step 11: ユーザーへの通知

【両者で協力】
Step 12: DNSの切り替え（オプション）
```

---

## Step 1: データのエクスポート（現在の管理者）

### 1.1 本番環境のデータベース接続情報を確認

Supabase Dashboardから以下を確認：

1. **Project Settings > Database** にアクセス
2. **Connection string** の `URI` をコピー

形式: `postgresql://postgres.xxxxx:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

### 1.2 データエクスポートスクリプトの実行

```bash
# プロジェクトルートに移動
cd /path/to/duel-log-app

# エクスポートスクリプトを実行
# 環境変数でデータベースURLを指定
export DATABASE_URL="postgresql://postgres.xxxxx:[password]@..."

./scripts/export-production-data.sh
```

実行すると、`data-exports/` ディレクトリに以下のファイルが生成されます：

```
data-exports/
├── backup_YYYYMMDD_HHMMSS/
│   ├── users.csv
│   ├── decks.csv
│   ├── duels.csv
│   ├── shared_statistics.csv
│   └── metadata.json
```

### 1.3 エクスポートデータの確認

```bash
# 各ファイルの行数を確認
wc -l data-exports/backup_*/users.csv
wc -l data-exports/backup_*/decks.csv
wc -l data-exports/backup_*/duels.csv
```

### 1.4 データを安全に共有

**重要**: エクスポートデータには個人情報（メールアドレス、パスワードハッシュ）が含まれます。

```bash
# データを圧縮
cd data-exports
tar -czf backup_YYYYMMDD_HHMMSS.tar.gz backup_YYYYMMDD_HHMMSS/

# パスワード付きZIPで暗号化（推奨）
zip -er backup_YYYYMMDD_HHMMSS.zip backup_YYYYMMDD_HHMMSS/
```

新しい管理者へ安全な方法（1Password、Google Drive等）で共有してください。

---

## Step 2: リポジトリとドキュメントの最終確認（現在の管理者）

### 2.1 READMEの更新

以下の情報が最新であることを確認：

- デプロイ先のURL
- 使用している外部サービス
- 環境変数の一覧

### 2.2 環境変数のドキュメント化

`.env.example` が最新であることを確認し、必要に応じて更新。

### 2.3 最終コミット

```bash
git add .
git commit -m "docs: 引き継ぎ用ドキュメント最終更新"
git push origin main
```

---

## Step 3: リポジトリのフォーク（新しい管理者）

### 3.1 GitHubでリポジトリをフォーク

1. 元のリポジトリページにアクセス: `https://github.com/[元の管理者]/duel-log-app`
2. **Fork** ボタンをクリック
3. 自分のアカウントにフォークを作成

### 3.2 ローカルにクローン

```bash
git clone https://github.com/[あなたのユーザー名]/duel-log-app.git
cd duel-log-app
```

---

## Step 4: 新規Supabaseプロジェクトのセットアップ（新しい管理者）

### 4.1 Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. **New Project** をクリック
3. 以下を入力：
   - **Name**: `duel-log-app-prod` （任意の名前）
   - **Database Password**: 強力なパスワードを生成（必ず保存）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
4. **Create new project** をクリック

プロジェクトの準備に約2分かかります。

### 4.2 データベース接続情報の取得

プロジェクト作成後：

1. **Project Settings > Database** にアクセス
2. **Connection string** の `URI` をコピー
3. `.env` ファイルとして保存（後で使用）

### 4.3 Supabase API情報の取得

1. **Project Settings > API** にアクセス
2. 以下をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` （管理用）

### 4.4 JWT Secretの取得

1. **Project Settings > API** の **JWT Settings** セクション
2. **JWT Secret** をコピー

---

## Step 5: データベーススキーマの構築（新しい管理者）

### 5.1 ローカル環境変数の設定

`backend/.env` ファイルを作成：

```bash
# Supabase接続情報（Step 4で取得）
DATABASE_URL=postgresql://postgres.xxxxx:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT署名用のシークレットキー（新規生成）
SECRET_KEY=$(openssl rand -base64 32)

# 環境設定
ENVIRONMENT=production

# フロントエンドURL（後で設定するVercelのURL）
FRONTEND_URL=https://your-app.vercel.app
```

### 5.2 Alembicマイグレーションの実行

```bash
cd backend

# Python仮想環境を作成
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# マイグレーションを実行（本番DBに接続）
alembic upgrade head
```

実行後、Supabase Studio（`https://supabase.com/dashboard/project/xxxxx/editor`）で以下のテーブルが作成されていることを確認：

- `users`
- `decks`
- `duels`
- `shared_statistics`

---

## Step 6: データのインポート（新しい管理者）

### 6.1 エクスポートデータの準備

現在の管理者から受け取ったデータを解凍：

```bash
# プロジェクトルートに移動
cd /path/to/duel-log-app

# データを解凍
unzip backup_YYYYMMDD_HHMMSS.zip
# または
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# data-exportsディレクトリに配置
mv backup_YYYYMMDD_HHMMSS data-exports/
```

### 6.2 インポートスクリプトの実行

```bash
# 環境変数でデータベースURLを指定
export DATABASE_URL="postgresql://postgres.xxxxx:[password]@..."

# インポートスクリプトを実行
./scripts/import-production-data.sh data-exports/backup_YYYYMMDD_HHMMSS
```

### 6.3 データの確認

```bash
# psqlで接続
psql "$DATABASE_URL"

# データ件数を確認
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM decks;
SELECT COUNT(*) FROM duels;
SELECT COUNT(*) FROM shared_statistics;

# 終了
\q
```

---

## Step 7: OAuth認証の設定（新しい管理者）

### 7.1 Google OAuth（オプション）

#### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成: `duel-log-app-prod`
3. **APIs & Services > OAuth consent screen** で同意画面を設定
4. **APIs & Services > Credentials** で OAuth 2.0 クライアントIDを作成
   - **Application type**: Web application
   - **Authorized redirect URIs**:
     - `https://xxxxx.supabase.co/auth/v1/callback`
5. **Client ID** と **Client Secret** をコピー

#### Supabaseでの設定

1. Supabase Dashboard: **Authentication > Providers**
2. **Google** を選択
3. **Enable Google provider** をON
4. **Client ID** と **Client Secret** を入力
5. **Save** をクリック

### 7.2 Discord OAuth（オプション）

#### Discord Developer Portalでの設定

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. **New Application** をクリック: `Duel Log App`
3. **OAuth2** セクションで以下を設定：
   - **Redirects**: `https://xxxxx.supabase.co/auth/v1/callback`
4. **Client ID** と **Client Secret** をコピー

#### Supabaseでの設定

1. Supabase Dashboard: **Authentication > Providers**
2. **Discord** を選択
3. **Enable Discord provider** をON
4. **Client ID** と **Client Secret** を入力
5. **Save** をクリック

---

## Step 8: バックエンドのデプロイ（Render）

### 8.1 Renderプロジェクトの作成

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. **New +** > **Web Service** をクリック
3. GitHubリポジトリを接続: `[あなたのユーザー名]/duel-log-app`
4. 以下を設定：
   - **Name**: `duel-log-app-backend`
   - **Region**: Singapore または Oregon（日本に近いリージョン）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: Free（または有料プラン）

### 8.2 環境変数の設定

Render Dashboard > **Environment** で以下を追加：

```bash
DATABASE_URL=postgresql://postgres.xxxxx:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret
SECRET_KEY=（openssl rand -base64 32で生成）
ENVIRONMENT=production
FRONTEND_URL=https://your-app.vercel.app
```

### 8.3 デプロイ

1. **Create Web Service** をクリック
2. デプロイが完了するまで待機（約5-10分）
3. デプロイ後のURLを確認: `https://duel-log-app-backend.onrender.com`

### 8.4 動作確認

```bash
# ヘルスチェック
curl https://duel-log-app-backend.onrender.com/health

# API Docs
open https://duel-log-app-backend.onrender.com/docs
```

---

## Step 9: フロントエンドのデプロイ（Vercel）

### 9.1 Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New** > **Project** をクリック
3. GitHubリポジトリを接続: `[あなたのユーザー名]/duel-log-app`
4. 以下を設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 9.2 環境変数の設定

Vercel Project Settings > **Environment Variables** で以下を追加：

```bash
VITE_API_URL=https://duel-log-app-backend.onrender.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9.3 デプロイ

1. **Deploy** をクリック
2. デプロイが完了するまで待機（約3-5分）
3. デプロイ後のURLを確認: `https://your-app.vercel.app`

### 9.4 バックエンドの環境変数を更新

Render Dashboard > **Environment** で `FRONTEND_URL` を更新：

```bash
FRONTEND_URL=https://your-app.vercel.app
```

保存後、バックエンドが自動的に再デプロイされます。

---

## Step 10: 動作確認（新しい管理者）

### 10.1 基本機能の確認

1. フロントエンドURL（`https://your-app.vercel.app`）にアクセス
2. 以下を確認：
   - ログインページが表示される
   - Google/Discord OAuth ボタンが表示される
   - メール/パスワードログインが可能

### 10.2 既存ユーザーでのログイン確認

**重要**: Supabase Authのユーザーデータは移行されていないため、既存ユーザーは**ログインできません**。

新規ユーザー登録が正常に動作することを確認してください。

### 10.3 データの確認

テストユーザーを作成し、以下を確認：

- デッキの作成/編集/削除
- 対戦履歴の登録
- 統計情報の表示
- CSVエクスポート/インポート

---

## Step 11: ユーザーへの通知（新しい管理者）

### 11.1 移行のお知らせ

既存ユーザーに以下の内容を通知してください。

#### テンプレート（メール/SNS投稿用）

```
【重要】Duel Log App 管理者交代のお知らせ

いつもDuel Log Appをご利用いただき、ありがとうございます。

この度、諸般の事情により、本アプリケーションの管理者が交代することになりました。
新しい管理者のもと、引き続きサービスを提供してまいります。

■ 変更点
- 新しいURL: https://your-app.vercel.app
- 旧URLからのリダイレクト: YYYY年MM月DD日まで有効

■ 既存ユーザーの皆様へ（重要）
システムの移行に伴い、大変恐縮ですが、**再度アカウント登録が必要**となります。

【再登録手順】
1. 新しいURL（https://your-app.vercel.app）にアクセス
2. 「新規登録」から同じメールアドレスで登録
3. 過去の対戦履歴をCSV形式でインポート（詳細は下記参照）

■ 対戦履歴の移行方法
旧環境で記録した対戦履歴をCSV形式でエクスポートし、新環境でインポートすることが可能です。

【手順】
1. 旧環境（https://old-url.com）にログイン
2. プロフィール > データエクスポート からCSVをダウンロード
3. 新環境にログイン後、プロフィール > データインポート からCSVをアップロード

■ 移行期間
- 旧環境のアクセス: YYYY年MM月DD日まで
- データエクスポート期限: YYYY年MM月DD日まで

■ お問い合わせ
ご不明な点がございましたら、以下までご連絡ください。
- GitHub Issues: https://github.com/[あなたのユーザー名]/duel-log-app/issues
- Twitter: @your_twitter_handle

今後ともDuel Log Appをよろしくお願いいたします。

新管理者: [あなたの名前]
```

### 11.2 旧環境の停止スケジュール

旧環境（元の管理者が管理）は、移行期間後に停止される予定です。
ユーザーが十分にデータをエクスポートできる期間（最低1ヶ月）を設けることを推奨します。

---

## Step 12: DNSの切り替え（オプション）

独自ドメインを使用している場合、DNSレコードを新しいデプロイ先に向けます。

### 12.1 Vercelでのカスタムドメイン設定

1. Vercel Project Settings > **Domains**
2. **Add Domain** で独自ドメインを追加
3. DNS設定画面で表示されるCNAMEレコードをDNSプロバイダーに追加

例：
```
CNAME  www  cname.vercel-dns.com
```

### 12.2 Renderでのカスタムドメイン設定

1. Render Dashboard > **Settings** > **Custom Domain**
2. バックエンドのドメイン（例: `api.example.com`）を追加
3. 表示されるCNAMEレコードをDNSプロバイダーに追加

---

## トラブルシューティング

### データインポート時のエラー

#### エラー: `COPY command failed`

**原因**: CSV形式が不正、または文字エンコーディングの問題

**解決策**:
```bash
# CSVのエンコーディングを確認
file data-exports/backup_*/users.csv

# UTF-8に変換（必要に応じて）
iconv -f ISO-8859-1 -t UTF-8 users.csv > users_utf8.csv
```

#### エラー: `foreign key constraint fails`

**原因**: テーブルのインポート順序が間違っている

**解決策**:
インポートスクリプトが以下の順序でインポートすることを確認：
1. users
2. decks
3. duels
4. shared_statistics

### OAuth認証が動作しない

#### 症状: Google/Discordログイン後にエラー

**確認項目**:
1. Supabase Dashboardで OAuth Providerが有効になっているか
2. Google/Discord Developer ConsoleのリダイレクトURIが正しいか
   - 正: `https://xxxxx.supabase.co/auth/v1/callback`
   - 誤: `https://your-app.vercel.app/auth/callback`
3. Client IDとClient Secretが正しく設定されているか

### バックエンドAPIが500エラーを返す

**確認項目**:
1. Render Logsでエラーメッセージを確認
2. 環境変数（特に`DATABASE_URL`）が正しく設定されているか
3. データベース接続が正常か（psqlでテスト接続）

```bash
# データベース接続テスト
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

## セキュリティ上の注意事項

### 1. 環境変数の管理

- `.env` ファイルは絶対にGitにコミットしない
- Supabase `service_role` キーは管理者のみが使用
- `SECRET_KEY` は定期的にローテーション

### 2. データエクスポートファイルの取り扱い

- エクスポートデータには個人情報が含まれるため、暗号化して共有
- 引き継ぎ完了後、エクスポートファイルを安全に削除

```bash
# データを完全に削除
rm -rf data-exports/backup_*
```

### 3. Supabaseのアクセス権限

- データベースへの直接アクセスは最小限に
- RLS（Row Level Security）は無効のため、バックエンドAPIで権限制御

---

## 引き継ぎ完了後のチェックリスト

以下を確認してください：

- [ ] 新しいSupabaseプロジェクトが正常に動作している
- [ ] データベーススキーマが正しく構築されている
- [ ] データが正常にインポートされている
- [ ] OAuth認証（Google/Discord）が動作している
- [ ] バックエンドAPI（Render）が正常に動作している
- [ ] フロントエンド（Vercel）が正常に動作している
- [ ] ユーザーへの移行通知を送信した
- [ ] 旧環境の停止スケジュールを決定した
- [ ] エクスポートデータを安全に削除した
- [ ] 新しいリポジトリのREADMEを更新した

---

## サポート

引き継ぎ中に問題が発生した場合：

1. **このリポジトリのIssues**: `https://github.com/[元の管理者]/duel-log-app/issues`
2. **元の管理者への直接連絡**（引き継ぎ期間中のみ）

---

## 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Vercelデプロイガイド](https://vercel.com/docs)
- [Renderデプロイガイド](https://render.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [Vue.js公式ドキュメント](https://vuejs.org/)

---

**最終更新日**: 2026-01-17
