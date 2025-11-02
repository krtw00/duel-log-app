# Repository Guidelines

## プロジェクト構成とモジュール配置
- `backend/app`: FastAPI本体。`api/`でルーター、`services/`でビジネスロジック、`schemas/`でPydantic定義、`models/`でSQLAlchemyモデルを管理します。
- `backend/alembic`: マイグレーション一式。リビジョン追加時は`alembic revision --autogenerate -m "add foo"`を使用し、`env.py`の設定を保持してください。
- `frontend/src`: Vue 3 + TypeScript UI。`components/`と`views/`にUI、Piniaストアと`__tests__/`にテストがまとまっています。
- `docs/`: APIリファレンスや開発ガイドを格納。新規ドキュメントは`docs/architecture/`など適切な階層に配置します。

## ビルド・テスト・開発コマンド
- `docker compose up --build -d`: Postgres・FastAPI・Viteをまとめて起動。
- `docker compose exec backend alembic upgrade head`: DBスキーマを最新リビジョンへ適用。
- `docker compose exec backend pytest`: バックエンドのテストとカバレッジを実行。
- `cd frontend && npm install`: フロント依存パッケージを導入。
- `npm run dev`: Vite開発サーバーを`http://localhost:5173`で起動。
- `npm run lint` / `npm run test:unit`: フロントのESLint検証とVitest単体テスト。

## コーディングスタイルと命名規約
- Python: Black + Ruffで幅88。関数は`snake_case`、SQLAlchemyモデルはPascalCase。importは自動整列を維持。
- TypeScript/Vue: Prettier + ESLintで2スペース、単一引用符、Composition API。コンポーネント名はPascalCase、composableは`useXxx.ts`。
- `pre-commit install`を推奨。保存時の整形を信頼し、手動整形は最小限に。

## テストガイドライン
- バックエンド: Pytest。必要に応じて`backend/tests/fixtures`を拡張し、変更箇所は80%以上のカバレッジを目指す。
- フロントエンド: Vitest + Vue Test Utils。テストファイルは対象コンポーネント名＋`.test.ts`で`__tests__/`に配置。
- 回帰防止のため既存シナリオ近辺へテスト追加。スナップショット更新時はレビュアーへ通知。

## コミットとプルリクエスト
- ブランチは`develop`由来で`feature/<課題>`や`fix/<課題>`。例: `git switch -c feature/value-sequence-ui`。
- コミットメッセージは`feat:`, `fix:`, `docs:`などのプリフィックスで要約を簡潔に記述。
- PRでは概要、テスト結果（例:`pytest`, `npm run test:unit`）、UI変更時のスクリーンショット、関連Issueを添付。CI成功後にレビュー依頼。

## セキュリティと設定
- 機密値は`.env`系に保存しGitへ追加しない。編集時は`docs/deployment.md`の変数一覧を参照。
- 実データ利用後は`docker compose down -v`でボリュームを破棄し不要なダンプを残さない。
