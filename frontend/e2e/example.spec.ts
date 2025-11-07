import { test, expect } from '@playwright/test';

/**
 * 基本的なスモークテスト
 * アプリケーションの基本機能が動作していることを確認します
 */

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // ページがロードされることを確認
    await expect(page).toHaveURL(/.*/);

    // タイトルが設定されていることを確認
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have accessible login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // ログインフォームの基本要素が存在することを確認
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should have accessible register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 登録フォームの基本要素が存在することを確認
    const usernameInput = page.locator('input[name="username"]');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // 認証が必要なページにアクセス
    await page.goto('/');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should have functioning OBS overlay page', async ({ page }) => {
    // OBSオーバーレイは認証不要でアクセス可能
    await page.goto('/obs-overlay');
    await expect(page).toHaveURL(/\/obs-overlay/);

    // ページがエラーなくロードされることを確認
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have valid navigation structure', async ({ page }) => {
    await page.goto('/login');

    // 基本的なナビゲーションリンクの存在を確認
    const registerLink = page.getByRole('link', {
      name: /register|登録|sign up/i,
    });
    const loginLink = page.getByRole('link', {
      name: /login|ログイン|sign in/i,
    });

    // 少なくとも1つのナビゲーションリンクが存在することを確認
    const registerVisible = await registerLink.isVisible({ timeout: 3000 }).catch(() => false);
    const loginVisible = await loginLink.isVisible({ timeout: 3000 }).catch(() => false);

    expect(registerVisible || loginVisible).toBeTruthy();
  });
});
