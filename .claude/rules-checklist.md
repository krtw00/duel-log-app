# コーディング規約 チェックリスト

このチェックリストは、コミット前・PR 作成前に確認すべき項目をまとめたものです。

## コード品質チェック

### ☐ フォーマット・リンティング
- **Python**: `ruff check . --fix && black .` を実行した
- **TypeScript/Vue**: `npm run format --prefix frontend` を実行した
- **エラーなし**: リンター・フォーマッターがエラーなく完了した

### ☐ 型チェック
- **Python**: `mypy backend/app --ignore-missing-imports` でエラーなし
- **TypeScript**: `npm run build --prefix frontend` で型エラーなし
- **型ヒント**: 新規関数にはすべて型ヒントを付与した

### ☐ テストカバレッジ
- **テスト実行**: `pytest` (バックエンド) または `npm run test:unit` (フロントエンド) で実行した
- **すべてパス**: テストが 100% パスしている
- **新機能**: 新規機能に対応するテストを追加した
- **カバレッジ**: ビジネスロジックは 80% 以上のカバレッジ

---

## 命名規則チェック

### ☐ Python コード
- **モジュール**: `snake_case` ファイル名（例: `deck_service.py`）
- **関数**: `snake_case` 関数名（例: `get_user_duels()`）
- **変数**: `snake_case` 変数名（例: `user_id`, `deck_list`）
- **クラス**: `PascalCase` クラス名（例: `DeckService`, `User`）
- **定数**: `UPPER_SNAKE_CASE` 定数名（例: `MAX_RECORDS`）

### ☐ TypeScript / Vue コード
- **ファイル**: `snake_case` ファイル名（例: `use_duel_form.ts`）
- **関数**: `snake_case` 関数名（例: `fetch_statistics()`）
- **コンポーネント**: `PascalCase.vue` ファイル名（例: `DuelFormDialog.vue`）
- **型**: `PascalCase` インターフェース名（例: `DuelStats`）

---

## ドキュメント・コメント

### ☐ Python コード
- **Docstring**: 複雑な関数には Google スタイルの Docstring を記載
  - 引数（Args）を明記
  - 戻り値（Returns）を明記
  - 発生しうる例外（Raises）を明記
- **インラインコメント**: ビジネスロジックの「なぜ」を説明

### ☐ TypeScript / Vue コード
- **JSDoc**: 複雑な関数には JSDoc を記載
  - `@param` で引数を説明
  - `@returns` で戻り値を説明
  - `@throws` で発生しうる例外を説明
- **Vue コンポーネント**: ファイル先頭にその役割を説明するコメント

---

## 例外処理・エラーハンドリング

### ☐ バックエンド（FastAPI）
- **カスタム例外**: `AppException` を使用して既知のエラーを処理
- **例外メッセージ**: ユーザーに理解可能なメッセージを返す
- **ログ記録**: `ERROR` レベルで詳細なエラーをログ
- **HTTP ステータス**: 適切なステータスコードを返す（404, 401, 403 など）

### ☐ フロントエンド（Vue）
- **API エラー**: Axios インターセプターで自動処理
- **ユーザー通知**: エラーはトースト通知で表示
- **ローディング**: 非同期処理中はローディング表示
- **バリデーション**: フォームエラーをフィールドに表示

---

## セキュリティ・ベストプラクティス

### ☐ コード内のシークレット
- ❌ API キー、パスワード、トークンをコード内に埋め込んでいない
- ✅ 環境変数（`.env` ファイル）から読み込んでいる
- ✅ `.gitignore` で `.env` ファイルを除外している

### ☐ 入力バリデーション
- **バックエンド**: Pydantic スキーマで自動バリデーション
- **フロントエンド**: クライアント側でも入力チェック実装
- **型安全**: TypeScript で `any` 型を使用していない

### ☐ 依存管理
- **アップデート**: セキュリティ更新は優先的に適用
- **ロック**: `requirements.txt` / `package-lock.json` で版を固定
- **監査**: `safety check` (Python) / `npm audit` (Node) で脆弱性をスキャン

---

## コミット・PR 運用

### ☐ コミットメッセージ
- **形式**: Conventional Commits に準拠（`type(scope): subject`）
- **例**: `feat(backend): add CSV import` / `fix(frontend): correct button style`
- **意味**: 変更の「何を」「なぜ」が明確
- **言語**: 英語で記述（ただし日本語説明は本体で OK）

### ☐ プルリクエスト
- **タイトル**: Conventional Commits 形式
- **説明**: 変更内容・背景・テスト方法を記載
- **レビュー対象**: 新規テストコード、重要な変更点に対してコメント
- **チェック**: すべての CI チェック・テストがパス

### ☐ ブランチ戦略
- **元ブランチ**: `develop` から新規ブランチを作成
- **ブランチ名**: `feature/GH-123-description` 形式
- **マージ先**: `develop` へ PR を作成
- **マージ方法**: Squash or Rebase（プロジェクト方針に従う）

---

## ファイル・フォルダ構造

### ☐ ファイル配置
- **バックエンド新規ファイル**: `backend/app/` 配下の適切なディレクトリ
  - サービス: `backend/app/services/`
  - モデル: `backend/app/models/`
  - スキーマ: `backend/app/schemas/`
  - API ルーター: `backend/app/api/routers/`
- **フロントエンド新規ファイル**: `frontend/src/` 配下の適切なディレクトリ
  - コンポーネント: `frontend/src/components/`
  - Composable: `frontend/src/composables/`
  - ストア: `frontend/src/stores/`

### ☐ インポート順序
- **Python**: `import` → `from` → 標準库 → サードパーティ → ローカルモジュール
- **TypeScript**: ビルトイン → 外部ライブラリ → ローカルモジュール

---

## デプロイ・リリース前チェック

### ☐ CHANGELOG 更新（機能追加時）
- **新規機能**: `## [Unreleased] - YYYY-MM-DD` セクションに記載
- **バグ修正**: `### Fixed` に記載
- **破壊的変更**: `### BREAKING CHANGES` に記載

### ☐ ドキュメント更新
- **API 変更**: `docs/api-reference.md` を更新
- **デプロイ手順**: `docs/deployment.md` に手順を記載
- **新規機能**: `README.md` に説明を追加

### ☐ バージョン管理
- **バージョン番号**: Semantic Versioning に従う（v1.2.3）
- **タグ作成**: リリース時に `git tag` でタグ作成
- **リリースノート**: GitHub Releases に詳細を記載

---

## 本番環境デプロイ前

### ☐ テスト
- **ユニットテスト**: 100% パス
- **統合テスト**: すべてのシナリオでパス
- **E2E テスト**: UI フロー全体で動作確認

### ☐ パフォーマンス
- **ロード時間**: 初期ロードが 3 秒以内
- **API 応答**: 重いクエリが 2 秒以内
- **メモリ使用**: メモリリークなし（DevTools で確認）

### ☐ セキュリティスキャン
- **CodeQL**: すべてのアラートが解決・無視化済み
- **依存性スキャン**: `safety check` / `npm audit` で脆弱性なし
- **CORS 設定**: 本番環境に適切な設定

---

## チェック完了後

✅ **すべての☐をチェック後、PR を作成してください**

不確定な項目がある場合は：
1. `.claude/coding-rules.md` の該当セクションを参照
2. チームレビュワーに質問
3. 関連ドキュメント（docs/error-handling.md など）を確認
