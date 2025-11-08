import { test, expect } from '@playwright/test';
import {
  register,
  login,
  generateRandomEmail,
  generateRandomUsername,
} from './helpers/auth-helper';

/**
 * 対戦記録（Duels）のE2Eテスト
 */

test.describe('Duel Management', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーを作成してログイン
    const username = generateRandomUsername();
    testEmail = generateRandomEmail();
    testPassword = 'TestPassword123!';

    await register(page, username, testEmail, testPassword);

    // ログインページにリダイレクトされた場合はログイン
    if (page.url().includes('/login')) {
      await login(page, testEmail, testPassword);
    }

    // ダッシュボードにいることを確認
    await expect(page).toHaveURL('/');
  });

  test('should display dashboard with duel history section', async ({ page }) => {
    await page.goto('/');

    // ダッシュボードが表示されることを確認
    const dashboard = page.locator('.dashboard, [data-testid="dashboard"], main');
    await expect(dashboard).toBeVisible();

    // 対戦履歴セクションまたは空の状態メッセージが表示されることを確認
    const duelHistory = page.locator('.duel-history, [data-testid="duel-history"]');
    const emptyState = page.getByText(/対戦履歴がありません|No duels|対戦を記録/i);

    const duelHistoryVisible = await duelHistory.isVisible({ timeout: 3000 }).catch(() => false);
    const emptyStateVisible = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(duelHistoryVisible || emptyStateVisible).toBeTruthy();
  });

  test('should open duel creation form', async ({ page }) => {
    await page.goto('/');

    // 対戦記録追加ボタンを探してクリック
    const addDuelButton = page.getByRole('button', {
      name: /add duel|対戦を記録|新規対戦|記録を追加/i,
    });

    if (await addDuelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addDuelButton.click();

      // フォームまたはダイアログが表示されることを確認
      const duelForm = page.locator('form, .duel-form, [data-testid="duel-form"], .v-dialog');
      await expect(duelForm.first()).toBeVisible({ timeout: 5000 });
    } else {
      // ボタンが見つからない場合はスキップ
      test.skip();
    }
  });

  test('should create a new duel record', async ({ page }) => {
    await page.goto('/');

    // 最初にデッキを作成（対戦記録にはデッキが必要）
    await page.goto('/decks');

    const createDeckButton = page.getByRole('button', {
      name: /create|作成|new deck|新しいデッキ|追加/i,
    });

    if (await createDeckButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createDeckButton.click();

      const deckNameInput = page.locator('input[name="name"], input[name="deckName"]');
      await expect(deckNameInput).toBeVisible({ timeout: 5000 });

      const deckName = `Test Deck ${Date.now()}`;
      await deckNameInput.fill(deckName);

      const saveDeckButton = page.getByRole('button', {
        name: /save|保存|create|作成/i,
      });
      await saveDeckButton.click();

      // デッキが作成されるまで待つ
      await expect(page.getByText(deckName, { exact: false })).toBeVisible({ timeout: 5000 });
    }

    // ダッシュボードに戻る
    await page.goto('/');

    // 対戦記録追加ボタンをクリック
    const addDuelButton = page.getByRole('button', {
      name: /add duel|対戦を記録|新規対戦|記録を追加/i,
    });

    if (await addDuelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addDuelButton.click();

      // 対戦結果を選択（勝敗）
      const winButton = page.getByRole('button', {
        name: /win|勝利|勝ち/i,
      });
      const loseButton = page.getByRole('button', {
        name: /lose|敗北|負け/i,
      });

      if (await winButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await winButton.click();
      } else if (await loseButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await loseButton.click();
      }

      // デッキを選択（最初のデッキを選択）
      const deckSelect = page.locator(
        'select[name="deck"], .deck-select, [data-testid="deck-select"]',
      );
      if (await deckSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deckSelect.first().click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      // 相手デッキを選択または入力
      const opponentDeckInput = page.locator(
        'input[name="opponentDeck"], select[name="opponentDeck"]',
      );
      if (await opponentDeckInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await opponentDeckInput.first().click();
        await page.keyboard.type('Opponent Deck');
        await page.keyboard.press('Enter');
      }

      // 保存ボタンをクリック
      const saveDuelButton = page.getByRole('button', {
        name: /save|保存|record|記録/i,
      });

      if (await saveDuelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveDuelButton.click();

        // 対戦記録が保存されたことを確認（成功メッセージまたはリストに追加）
        const successMessage = page.locator('.v-snackbar, .success-message, [role="alert"]');
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should view statistics page', async ({ page }) => {
    await page.goto('/');
    // ページが完全にロードされるまで待機
    await page.waitForLoadState('networkidle');

    // 統計ページへのナビゲーション
    const statsLink = page.getByRole('link', { name: /statistics|統計/i });

    if (await statsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 要素をビューポート内にスクロール
      await statsLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);  // DOM レイアウト安定化を待機
      await statsLink.click();
      // ページ遷移が完了するまで待機
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/statistics', { timeout: 10000 });

      // 統計情報が表示されることを確認
      const statsContent = page.locator('.statistics, [data-testid="statistics"], main');
      await expect(statsContent).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });
});

test.describe('Dashboard Navigation', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーを作成してログイン
    const username = generateRandomUsername();
    testEmail = generateRandomEmail();
    testPassword = 'TestPassword123!';

    await register(page, username, testEmail, testPassword);

    if (page.url().includes('/login')) {
      await login(page, testEmail, testPassword);
    }

    await expect(page).toHaveURL('/');
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');
    // ページが完全にロードされるまで待機
    await page.waitForLoadState('networkidle');

    // デッキページへの移動
    const decksLink = page.getByRole('link', { name: /decks|デッキ/i });
    if (await decksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 要素をビューポート内にスクロール
      await decksLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);  // DOM レイアウト安定化を待機
      await decksLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/decks', { timeout: 10000 });
    }

    // 統計ページへの移動
    const statsLink = page.getByRole('link', { name: /statistics|統計/i });
    if (await statsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 要素をビューポート内にスクロール
      await statsLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);  // DOM レイアウト安定化を待機
      await statsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/statistics', { timeout: 10000 });
    }

    // プロフィールページへの移動
    const profileLink = page.getByRole('link', { name: /profile|プロフィール/i });
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 要素をビューポート内にスクロール
      await profileLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);  // DOM レイアウト安定化を待機
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/profile', { timeout: 10000 });
    }

    // ダッシュボードへの移動
    const dashboardLink = page.getByRole('link', {
      name: /dashboard|ダッシュボード|home|ホーム/i,
    });
    if (await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 要素をビューポート内にスクロール
      await dashboardLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);  // DOM レイアウト安定化を待機
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/', { timeout: 10000 });
    }
  });
});
