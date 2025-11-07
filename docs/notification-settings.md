# GitHub 通知設定ガイド

CI が実行するたびにメール通知が送られている場合、GitHub の通知設定を調整して不要なメールを減らすことができます。

## 推奨設定

### 1. GitHub アカウント設定での通知設定

1. **GitHub にログイン**
2. **設定（Settings）** → **通知（Notifications）** に移動
3. 以下の設定を確認：

#### メール通知の設定

| 項目 | 推奨設定 |
|------|--------|
| **自動化されたページの更新** | ✓ 無効化 |
| **Dependabot アラート** | ✓ 有効（重要な更新のみ） |
| **セキュリティ アラート** | ✓ 有効 |
| **CI/CD 実行結果** | ✓ 失敗時のみ |
| **Pull Request のコメント** | ✓ 言及されたときのみ |

### 2. リポジトリごとの通知設定

1. **リポジトリページ** → **Watch** ボタンを確認
2. **Custom** を選択して細かく制御：
   - ✓ **Pushes**（開発に関連する場合のみ）
   - ✓ **Pull requests**
   - ✓ **Discussions**（オプション）
   - ✗ **Issues comments**（確認しない場合は無効化）
   - ✗ **Releases**（不要な場合は無効化）

### 3. Dependabot 通知の設定

リポジトリの **Settings** → **Code security and analysis** → **Dependabot alerts**：
- **Email notifications** を無効化（Web 上で確認できるため）

### 4. GitHub Actions 通知の制御

リポジトリの **Settings** → **Actions** → **Notifications**：
- ✓ **Workflow runs** - 失敗時のみ有効化

## 実装済みの自動化対策

このプロジェクトでは以下の対策を既に実装しています：

### PR 自動レビューコメント

- **変更内容**: PR Auto Review ワークフローで、警告がある場合のみコメントを作成
- **効果**: 全 PR でコメント通知が送られていたのを、警告がある場合のみに削減

## トラブルシューティング

### メールが多く届く場合

1. **GitHub 通知設定を確認**
   - Settings → Notifications で「All Activity」になっていないか確認
   - 「Only Participating and @mentions」に変更

2. **リポジトリの Watch 設定を確認**
   - リポジトリ → Watch → Custom で不要な項目を無効化

3. **メールフィルターの活用**
   - GitHub 通知メールをフォルダに自動振り分け
   - メールアドレス: `notifications@github.com` をフィルター条件に使用

### 重要な通知を見落とさないために

- **GitHub の Web 通知** を活用（デスクトップ通知）
- 重要な通知のみメール有効化
- セキュリティアラートはメール有効化推奨

## リファレンス

- [GitHub Notifications ドキュメント](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications)
- [GitHub Actions Notifications](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/notifications-for-workflow-runs)
