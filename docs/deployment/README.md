# デプロイ・運用

このディレクトリは、本番環境へのデプロイ、CI/CD パイプライン、通知設定など、運用フェーズで必要な情報をまとめたものです。

## 📚 ドキュメント一覧

- **[deployment.md](./deployment.md)** - Vercel（フロントエンド）、Render（バックエンド）へのデプロイ手順、本番環境設定について説明します。
- **[ci-cd-guide.md](./ci-cd-guide.md)** - GitHub Actions ワークフロー（CI, CodeQL, E2E, Lighthouse, Release）の説明とトラブルシューティング。
- **[notification-settings.md](./notification-settings.md)** - CI実行時のメール通知削減、GitHub通知設定の推奨設定について説明します。

## 🎯 このセクションを読むべき人

- **デプロイ担当者**: 本番環境へのデプロイ手順を確認したい場合
- **DevOps/CI-CD担当者**: GitHub Actions ワークフローを管理したい場合
- **全開発者**: メール通知を制御したい場合

## 📖 読む順序

**初回デプロイの場合:**
1. [deployment.md](./deployment.md) - デプロイ環境とプロセスを理解
2. [ci-cd-guide.md](./ci-cd-guide.md) - CI/CD パイプラインの構成を確認

**運用時:**
- [notification-settings.md](./notification-settings.md) - 通知設定を調整
- [ci-cd-guide.md](./ci-cd-guide.md) - トラブルシューティングを参照
