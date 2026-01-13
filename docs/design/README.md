# 設計思想・ベストプラクティス

このディレクトリは、エラーハンドリング、コード品質、保守性向上に関する設計思想とベストプラクティスをまとめたものです。

## 📚 ドキュメント一覧

- **[error-handling.md](./error-handling.md)** - バックエンド・フロントエンドにおけるエラー処理の設計パターンと実装例を定義しています。
- **[code-readability-guide.md](./code-readability-guide.md)** - ドキュメンテーション、インラインコメント、命名規則の統一に関するガイドライン、および長期的な品質改善ロードマップを提供します。
- **[internationalization.md](./internationalization.md)** - 多言語対応（i18n）の設計。日本語・英語・韓国語対応のためのvue-i18n導入計画と実装ガイド。
- **[feedback-and-contact.md](./feedback-and-contact.md)** - フィードバック・連絡先機能の設計。GitHub Issues連携によるバグ報告・機能リクエスト、ヘルプメニューの実装ガイド。

## 🎯 このセクションを読むべき人

- **全開発者**: エラーハンドリングの設計パターンを理解したい場合
- **コードレビュアー**: コード品質基準を確認したい場合
- **アーキテクト**: 保守性向上の施策を検討したい場合

## 📖 読む順序

1. [error-handling.md](./error-handling.md) - エラー処理の設計パターンを理解
2. [code-readability-guide.md](./code-readability-guide.md) - コード品質とドキュメント化について確認

## 📌 注記

**コーディング規約について:**
コーディング規約（フォーマッター、リンター、命名規則）は `.claude/coding-rules.md` に統合され、AI向けドキュメントとして保管されています。
詳細は [../.claude/coding-rules.md](../../.claude/coding-rules.md) を参照してください。
