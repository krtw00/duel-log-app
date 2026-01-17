# プロジェクト引き継ぎチェックリスト

このチェックリストは、Duel Log Appの管理者交代をスムーズに進めるためのものです。
各項目を確認しながら、順番に進めてください。

---

## 事前準備

### 現在の管理者

- [ ] 新しい管理者と引き継ぎスケジュールを調整
- [ ] 新しい管理者が必要なアカウントを作成済みか確認
  - [ ] GitHub
  - [ ] Supabase
  - [ ] Vercel
  - [ ] Render
- [ ] 新しい管理者が必要なツールをインストール済みか確認
  - [ ] Docker Desktop
  - [ ] Node.js (v18+)
  - [ ] Python (3.11+)
  - [ ] PostgreSQL Client (psql)
  - [ ] Supabase CLI

### 新しい管理者

- [ ] 上記のアカウントをすべて作成
- [ ] 上記のツールをすべてインストール
- [ ] `docs/operations/handover-guide.md` を一読

---

## フェーズ1: データエクスポート（現在の管理者）

**担当**: 現在の管理者
**所要時間**: 30分〜1時間

- [ ] 本番環境のデータベース接続情報を確認
  - Supabase Dashboard > Project Settings > Database > Connection string (URI)
- [ ] エクスポートスクリプトを実行
  ```bash
  export DATABASE_URL="postgresql://..."
  ./scripts/export-production-data.sh
  ```
- [ ] エクスポートデータを確認
  ```bash
  ls -lh data-exports/backup_*/
  wc -l data-exports/backup_*/*.csv
  ```
- [ ] データを圧縮
  ```bash
  cd data-exports
  zip -er backup_YYYYMMDD_HHMMSS.zip backup_YYYYMMDD_HHMMSS/
  ```
- [ ] データを安全に新しい管理者へ共有（1Password, Google Drive等）
- [ ] `.env.example` が最新であることを確認
- [ ] README.md が最新であることを確認
- [ ] 最終コミット&プッシュ
  ```bash
  git add .
  git commit -m "docs: 引き継ぎ用ドキュメント最終更新"
  git push origin main
  ```

---

## フェーズ2: リポジトリのフォーク（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 10分

- [ ] GitHubで元のリポジトリをフォーク
- [ ] フォークしたリポジトリをローカルにクローン
  ```bash
  git clone https://github.com/[あなたのユーザー名]/duel-log-app.git
  cd duel-log-app
  ```
- [ ] エクスポートデータを受け取り、解凍
  ```bash
  unzip backup_YYYYMMDD_HHMMSS.zip
  mv backup_YYYYMMDD_HHMMSS data-exports/
  ```

---

## フェーズ3: Supabaseプロジェクトのセットアップ（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 15分

- [ ] Supabaseで新規プロジェクトを作成
  - Name: `duel-log-app-prod`
  - Region: `Northeast Asia (Tokyo)`
  - Database Password: 強力なパスワード（保存必須）
- [ ] プロジェクトの作成完了を待つ（約2分）
- [ ] データベース接続情報を取得
  - Project Settings > Database > Connection string (URI)
- [ ] Supabase API情報を取得
  - Project Settings > API
  - Project URL
  - anon public key
  - service_role key
  - JWT Secret
- [ ] 情報を安全に保存（パスワードマネージャー推奨）

---

## フェーズ4: データベーススキーマの構築（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 10分

- [ ] `backend/.env` ファイルを作成
  ```bash
  cd backend
  cp .env.example .env
  # エディタで .env を編集し、Supabase情報を設定
  ```
- [ ] Python仮想環境を作成
  ```bash
  python3 -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```
- [ ] 依存関係をインストール
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Alembicマイグレーションを実行
  ```bash
  alembic upgrade head
  ```
- [ ] Supabase Studioでテーブルが作成されたことを確認
  - users, decks, duels, shared_statistics

---

## フェーズ5: データのインポート（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 10分

- [ ] インポートスクリプトを実行
  ```bash
  cd /path/to/duel-log-app
  export DATABASE_URL="postgresql://..."
  ./scripts/import-production-data.sh data-exports/backup_YYYYMMDD_HHMMSS
  ```
- [ ] インポート完了メッセージを確認
- [ ] psqlでデータ件数を確認
  ```bash
  psql "$DATABASE_URL"
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM decks;
  SELECT COUNT(*) FROM duels;
  \q
  ```

---

## フェーズ6: OAuth認証の設定（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 30分（オプション機能のため、後回し可能）

### Google OAuth（オプション）

- [ ] Google Cloud Consoleで新規プロジェクトを作成
- [ ] OAuth consent screenを設定
- [ ] OAuth 2.0 Client IDを作成
  - Authorized redirect URIs: `https://xxxxx.supabase.co/auth/v1/callback`
- [ ] Client IDとClient Secretをコピー
- [ ] Supabase Dashboard > Authentication > Providers > Google
  - Enable Google provider
  - Client IDとClient Secretを入力
- [ ] 保存

### Discord OAuth（オプション）

- [ ] Discord Developer Portalで新規アプリケーションを作成
- [ ] OAuth2セクションでRedirectsを設定
  - `https://xxxxx.supabase.co/auth/v1/callback`
- [ ] Client IDとClient Secretをコピー
- [ ] Supabase Dashboard > Authentication > Providers > Discord
  - Enable Discord provider
  - Client IDとClient Secretを入力
- [ ] 保存

---

## フェーズ7: バックエンドのデプロイ（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 15分

- [ ] Render Dashboardで新規Web Serviceを作成
  - GitHubリポジトリを接続
  - Name: `duel-log-app-backend`
  - Root Directory: `backend`
  - Runtime: Docker
  - Instance Type: Free
- [ ] 環境変数を設定
  - DATABASE_URL
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_JWT_SECRET
  - SECRET_KEY (新規生成: `openssl rand -base64 32`)
  - ENVIRONMENT=production
  - FRONTEND_URL (後で設定)
- [ ] Create Web Serviceをクリック
- [ ] デプロイ完了を待つ（約5-10分）
- [ ] デプロイURLを確認: `https://duel-log-app-backend.onrender.com`
- [ ] ヘルスチェック
  ```bash
  curl https://duel-log-app-backend.onrender.com/health
  ```

---

## フェーズ8: フロントエンドのデプロイ（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 10分

- [ ] Vercel Dashboardで新規プロジェクトを作成
  - GitHubリポジトリを接続
  - Framework Preset: Vite
  - Root Directory: `frontend`
- [ ] 環境変数を設定
  - VITE_API_URL=https://duel-log-app-backend.onrender.com
  - VITE_SUPABASE_URL=https://xxxxx.supabase.co
  - VITE_SUPABASE_ANON_KEY=eyJhbGci...
- [ ] Deployをクリック
- [ ] デプロイ完了を待つ（約3-5分）
- [ ] デプロイURLを確認: `https://your-app.vercel.app`
- [ ] Render Dashboardでバックエンドの環境変数を更新
  - FRONTEND_URL=https://your-app.vercel.app
- [ ] バックエンドの再デプロイを待つ

---

## フェーズ9: 動作確認（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 30分

### 基本機能

- [ ] フロントエンドURL（`https://your-app.vercel.app`）にアクセス
- [ ] ログインページが表示される
- [ ] Google/Discord OAuthボタンが表示される（設定済みの場合）
- [ ] メール/パスワードで新規ユーザー登録
- [ ] ログインが成功する
- [ ] ダッシュボードが表示される

### データ確認

- [ ] テストデッキを作成
- [ ] テスト対戦履歴を登録
- [ ] 統計情報が正しく表示される
- [ ] CSVエクスポートが動作する
- [ ] CSVインポートが動作する

### OAuth確認（設定済みの場合）

- [ ] Googleログインが動作する
- [ ] Discordログインが動作する

### 管理者機能

- [ ] プロフィールページでOBSトークンを生成
- [ ] OBSオーバーレイページにアクセス
  - `https://your-app.vercel.app/obs-overlay?token=obs_token_xxxx`
- [ ] 配信者モードが動作する

---

## フェーズ10: ユーザーへの通知（新しい管理者）

**担当**: 新しい管理者
**所要時間**: 1時間

- [ ] ユーザー向け移行お知らせを作成
  - `docs/operations/handover-guide.md` のテンプレートを使用
- [ ] 移行スケジュールを決定
  - 旧環境のアクセス可能期間（推奨: 1ヶ月以上）
  - データエクスポート期限
- [ ] お知らせを公開
  - [ ] GitHub Issues
  - [ ] Twitter/X
  - [ ] Discord（ある場合）
  - [ ] アプリ内通知（可能であれば）
- [ ] 旧環境にバナーを表示（可能であれば）
  - 新URLへのリダイレクト案内

---

## フェーズ11: 最終確認（両者で協力）

**担当**: 現在の管理者 + 新しい管理者
**所要時間**: 1時間

### 新しい管理者

- [ ] すべての機能が正常に動作することを確認
- [ ] ドキュメントに不明点がないか確認
- [ ] 緊急時の連絡先を確認

### 現在の管理者

- [ ] 旧環境の停止スケジュールをユーザーに通知
- [ ] 旧環境のデータベースバックアップを取得（念のため）
- [ ] 新しい管理者へ引き継ぎ完了を確認

### 両者

- [ ] 引き継ぎドキュメントのレビュー
- [ ] 問題点や改善点をドキュメントに反映

---

## フェーズ12: 旧環境の停止（現在の管理者）

**担当**: 現在の管理者
**実施時期**: ユーザー通知から1ヶ月後（推奨）

- [ ] ユーザーへ最終通知（1週間前）
- [ ] 旧環境のアクセスを停止
  - [ ] Vercel: プロジェクトを削除
  - [ ] Render: サービスを削除
  - [ ] Supabase: プロジェクトを削除（慎重に）
- [ ] DNSレコードを削除（独自ドメインの場合）
- [ ] GitHubリポジトリにアーカイブマーク
  - またはREADMEに「このリポジトリは移行しました」と記載

---

## トラブルシューティング

問題が発生した場合は以下を確認してください：

### データインポートエラー

- [ ] CSVファイルのエンコーディングがUTF-8か確認
- [ ] テーブルが正しい順序でインポートされているか確認
- [ ] 外部キー制約のエラーメッセージを確認

### OAuth認証エラー

- [ ] リダイレクトURIが正しく設定されているか確認
- [ ] Client IDとClient Secretが正しいか確認
- [ ] Supabase DashboardでProviderが有効になっているか確認

### バックエンドAPIエラー

- [ ] Render Logsでエラーメッセージを確認
- [ ] 環境変数が正しく設定されているか確認
- [ ] データベース接続が正常か確認（psqlでテスト）

### その他

- [ ] `docs/operations/handover-guide.md` のトラブルシューティングセクションを参照
- [ ] GitHub Issuesで質問を投稿
- [ ] 元の管理者に連絡（引き継ぎ期間中のみ）

---

## 引き継ぎ完了の確認

すべてのチェックボックスにチェックが入ったら、引き継ぎは完了です！

- [ ] すべてのフェーズが完了
- [ ] すべての動作確認が完了
- [ ] ユーザーへの通知が完了
- [ ] ドキュメントが最新
- [ ] 新しい管理者が自信を持って運営できる状態

お疲れ様でした！

---

**最終更新日**: 2026-01-17
