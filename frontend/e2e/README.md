# E2E テスト（Playwright）

このディレクトリには、Playwrightを使用したEnd-to-End（E2E）テストが含まれています。

## 📋 テスト構成

### テストファイル

- `example.spec.ts` - 基本的なスモークテスト
- `auth.spec.ts` - 認証フロー（ログイン、登録、ログアウト、パスワードリセット）
- `decks.spec.ts` - デッキ管理（作成、編集、削除）
- `duels.spec.ts` - 対戦記録とダッシュボードナビゲーション

### ヘルパー

- `helpers/auth-helper.ts` - 認証関連のヘルパー関数

## 🚀 実行方法

### 前提条件

Playwrightのインストールとブラウザのセットアップが必要です：

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール
npx playwright install --with-deps
```

### テストの実行

```bash
# 全テストを実行
npm run test:e2e

# UIモードでテストを実行（デバッグに便利）
npm run test:e2e:ui

# デバッグモードでテストを実行
npm run test:e2e:debug

# 特定のテストファイルのみ実行
npx playwright test auth.spec.ts

# 特定のブラウザでのみ実行
npx playwright test --project=chromium
```

### レポートの表示

```bash
# HTMLレポートを開く
npx playwright show-report
```

## 🔧 設定

テストの設定は `playwright.config.ts` で行います。

主な設定項目：

- **baseURL**: テストのベースURL（デフォルト: `http://localhost:4173`）
- **projects**: テストするブラウザ（Chromium, Firefox, WebKit）
- **retries**: CIでのリトライ回数
- **workers**: 並列実行数

## 📝 テストの書き方

### 基本的な構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');

    // 要素の操作
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // アサーション
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### ヘルパーの使用

```typescript
import { login, generateRandomEmail } from './helpers/auth-helper';

test('should access protected page', async ({ page }) => {
  const email = generateRandomEmail();
  const password = 'TestPassword123!';

  // ヘルパーを使用してログイン
  await login(page, email, password);

  // 保護されたページにアクセス
  await page.goto('/decks');
});
```

## 🐛 デバッグ

### UIモード

UIモードは最も便利なデバッグ方法です：

```bash
npm run test:e2e:ui
```

機能：

- ステップバイステップ実行
- タイムトラベルデバッグ
- スクリーンショット表示
- ネットワークリクエストの確認

### デバッグモード

特定のテストをデバッグするには：

```bash
npm run test:e2e:debug auth.spec.ts
```

### ヘッドモードで実行

ブラウザを表示してテストを実行：

```bash
npx playwright test --headed
```

### スローモーション

操作をゆっくり実行：

```bash
npx playwright test --headed --slow-mo=1000
```

## 📸 スクリーンショットとトレース

失敗時に自動的にスクリーンショットが撮られ、トレースが記録されます。

トレースの表示：

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## 🔄 CI/CD

GitHub Actionsで自動的に実行されます（`.github/workflows/e2e.yml`）。

テストは以下のタイミングで実行されます：

- mainブランチへのプッシュ時
- Pull Request作成時
- 手動実行（workflow_dispatch）

### CI環境での最適化

E2E CIは以下の最適化を実施して、実行時間を大幅に短縮しています：

#### 1. **ブラウザテストの最適化**
- CI環境ではChromiumのみでテスト実行（約66%の時間短縮）
- ローカル開発では全ブラウザ（Chromium, Firefox, WebKit）でテスト可能
- `playwright.config.ts`で環境に応じて自動切り替え

#### 2. **キャッシング戦略**
- **npm依存関係**: `actions/setup-node`のcache機能を使用
- **pip依存関係**: `actions/setup-python`のcache機能を使用
- **Playwrightブラウザ**: `~/.cache/ms-playwright`をキャッシュ（約2-3分短縮）
- **フロントエンドビルド**: `frontend/dist`をキャッシュ（約1-2分短縮）

#### 3. **並列実行**
- CI環境では2ワーカーで並列実行（`workers: 2`）
- テスト時間を約30-40%短縮

#### 4. **効率的なブラウザインストール**
- キャッシュヒット時はシステム依存関係のみ更新
- Chromiumのみインストールで高速化

これらの最適化により、**実行時間を約20分 → 5-7分に短縮**しています。

## ⚠️ 注意事項

1. **データの独立性**: 各テストは独立したデータを使用する必要があります
2. **ランダムデータ**: `generateRandomEmail()`などを使用してデータの衝突を避けます
3. **タイムアウト**: ネットワーク遅延を考慮したタイムアウトを設定します
4. **セレクタ**: できるだけロールベースのセレクタを使用します（アクセシビリティ向上）

## 📚 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
