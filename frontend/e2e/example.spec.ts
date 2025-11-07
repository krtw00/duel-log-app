import { test, expect } from '@playwright/test'

/**
 * サンプルE2Eテスト
 *
 * 実際のアプリケーションに合わせて、以下のようなテストを追加してください：
 * - ログイン/ログアウトフロー
 * - デッキ作成・編集・削除
 * - 対戦記録の追加・編集・削除
 * - 統計情報の表示
 * - OBSオーバーレイの表示
 */

test.describe('Basic Application Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Duel Log/i)
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // ログインボタンやリンクを探す
    const loginLink = page.getByRole('link', { name: /login|ログイン/i })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/.*login/)
    }
  })

  test('should show register page', async ({ page }) => {
    await page.goto('/')

    // 登録ボタンやリンクを探す
    const registerLink = page.getByRole('link', { name: /register|登録|sign up/i })
    if (await registerLink.isVisible()) {
      await registerLink.click()
      await expect(page).toHaveURL(/.*register/)
    }
  })
})

/**
 * 認証フローのテスト例
 */
test.describe('Authentication Flow', () => {
  test.skip('should login successfully with valid credentials', async ({ page }) => {
    // TODO: 実装例
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test.skip('should show error with invalid credentials', async ({ page }) => {
    // TODO: 実装例
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.error-message')).toBeVisible()
  })
})
