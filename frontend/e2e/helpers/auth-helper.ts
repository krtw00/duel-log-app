import { Page, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * E2Eテスト用の認証ヘルパー
 */

/**
 * テスト用ユーザーのログイン
 * @param page Playwrightのページインスタンス
 * @param email ログインに使用するメールアドレス
 * @param password ログインに使用するパスワード
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // ダッシュボードへのリダイレクトを待つ
  await page.waitForURL('/', { timeout: 10000 });
  await expect(page).toHaveURL('/');
}

/**
 * テスト用ユーザーの登録
 * @param page Playwrightのページインスタンス
 * @param username 作成するユーザー名
 * @param email 登録用メールアドレス
 * @param password 登録用パスワード
 */
export async function register(page: Page, username: string, email: string, password: string) {
  await page.goto('/register');

  // フォーム入力
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // パスワード確認フィールドが存在する場合
  const confirmPasswordField = page.locator(
    'input[name="password_confirm"], input[name="confirmPassword"]',
  );
  if ((await confirmPasswordField.count()) > 0) {
    await confirmPasswordField.fill(password);
  }

  // 登録ボタンをクリック
  await page.click('button[type="submit"]');

  // ダッシュボードまたはログインページへのリダイレクトを待つ
  await page.waitForURL(/\/(login)?$/, { timeout: 10000 });
}

/**
 * ログアウト
 * @param page Playwrightのページインスタンス
 */
export async function logout(page: Page) {
  // ユーザーメニューまたはログアウトボタンを探す
  const logoutButton = page.getByRole('button', { name: /logout|ログアウト/i });

  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  } else {
    // メニューを開いてログアウトを探す
    const menuButton = page.getByRole('button', {
      name: /menu|メニュー|account|アカウント/i,
    });
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.click();
      await page.getByRole('menuitem', { name: /logout|ログアウト/i }).click();
    }
  }

  // ログインページへのリダイレクトを待つ
  await page.waitForURL('/login', { timeout: 10000 });
}

/**
 * ランダムなメールアドレスを生成
 * 暗号的に安全な乱数生成器を使用
 * @returns 生成したメールアドレス
 */
export function generateRandomEmail(): string {
  const randomString = randomBytes(8).toString('hex');
  return `test-${randomString}@example.com`;
}

/**
 * ランダムなユーザー名を生成
 * 暗号的に安全な乱数生成器を使用
 * @returns 生成したユーザー名
 */
export function generateRandomUsername(): string {
  const randomString = randomBytes(8).toString('hex');
  return `testuser-${randomString}`;
}
