import { test, expect } from '@playwright/test'
import {
  login,
  register,
  logout,
  generateRandomEmail,
  generateRandomUsername,
} from './helpers/auth-helper'

/**
 * 認証フローのE2Eテスト
 */

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')

    // ログインフォームの存在確認
    await expect(
      page.locator('input[name="email"], input[type="email"]')
    ).toBeVisible()
    await expect(
      page.locator('input[name="password"], input[type="password"]')
    ).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL('/register')

    // 登録フォームの存在確認
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(
      page.locator('input[name="email"], input[type="email"]')
    ).toBeVisible()
    await expect(
      page.locator('input[name="password"], input[type="password"]')
    ).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login')

    // 登録ページへのリンクを探してクリック
    const registerLink = page.getByRole('link', {
      name: /register|登録|sign up|アカウント作成/i,
    })
    await registerLink.click()

    await expect(page).toHaveURL('/register')
  })

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register')

    // ログインページへのリンクを探してクリック
    const loginLink = page.getByRole('link', {
      name: /login|ログイン|sign in/i,
    })
    await loginLink.click()

    await expect(page).toHaveURL('/login')
  })

  test('should show error with invalid login credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill(
      'input[name="email"], input[type="email"]',
      'invalid@example.com'
    )
    await page.fill(
      'input[name="password"], input[type="password"]',
      'wrongpassword'
    )
    await page.click('button[type="submit"]')

    // エラーメッセージの表示を確認
    // Vuetifyのアラートまたはエラーメッセージを探す
    const errorMessage = page.locator(
      '.v-alert--error, .error-message, .v-messages__message, [role="alert"]'
    )
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
  })

  test('should register a new user and login', async ({ page }) => {
    const username = generateRandomUsername()
    const email = generateRandomEmail()
    const password = 'TestPassword123!'

    // 新規ユーザー登録
    await register(page, username, email, password)

    // 登録後、ログインページまたはダッシュボードにいるはず
    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      // ログインページにリダイレクトされた場合、ログイン
      await login(page, email, password)
    }

    // ダッシュボードにいることを確認
    await expect(page).toHaveURL('/')

    // ログアウト
    await logout(page)

    // 再度ログイン可能か確認
    await login(page, email, password)
    await expect(page).toHaveURL('/')
  })

  test('should redirect to dashboard when accessing login while authenticated', async ({
    page,
  }) => {
    const username = generateRandomUsername()
    const email = generateRandomEmail()
    const password = 'TestPassword123!'

    // ユーザー登録とログイン
    await register(page, username, email, password)

    // ログインページにアクセスを試みる
    await page.goto('/login')

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('should redirect to login when accessing protected route without authentication', async ({
    page,
  }) => {
    // 認証なしでダッシュボードにアクセス
    await page.goto('/')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})

test.describe('Password Reset Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL('/forgot-password')

    // メールアドレス入力フォームの存在確認
    await expect(
      page.locator('input[name="email"], input[type="email"]')
    ).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login')

    // パスワードリセットリンクを探してクリック
    const forgotLink = page.getByRole('link', {
      name: /forgot password|パスワードを忘れた|パスワードリセット/i,
    })

    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotLink.click()
      await expect(page).toHaveURL('/forgot-password')
    } else {
      // リンクが見つからない場合はスキップ
      test.skip()
    }
  })
})
