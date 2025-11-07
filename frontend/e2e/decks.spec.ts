import { test, expect } from '@playwright/test'
import {
  register,
  login,
  generateRandomEmail,
  generateRandomUsername,
} from './helpers/auth-helper'

/**
 * デッキ管理のE2Eテスト
 */

test.describe('Deck Management', () => {
  let testEmail: string
  let testPassword: string

  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーを作成してログイン
    const username = generateRandomUsername()
    testEmail = generateRandomEmail()
    testPassword = 'TestPassword123!'

    await register(page, username, testEmail, testPassword)

    // ログインページにリダイレクトされた場合はログイン
    if (page.url().includes('/login')) {
      await login(page, testEmail, testPassword)
    }

    // ダッシュボードにいることを確認
    await expect(page).toHaveURL('/')
  })

  test('should navigate to decks page', async ({ page }) => {
    // デッキページへのナビゲーション
    const decksLink = page.getByRole('link', { name: /decks|デッキ/i })
    await decksLink.click()

    await expect(page).toHaveURL('/decks')
  })

  test('should display deck list', async ({ page }) => {
    await page.goto('/decks')

    // デッキリストまたは空の状態メッセージが表示されることを確認
    const deckList = page.locator('.deck-list, [data-testid="deck-list"]')
    const emptyState = page.getByText(/デッキがありません|No decks|デッキを作成/i)

    const deckListVisible = await deckList
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const emptyStateVisible = await emptyState
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    expect(deckListVisible || emptyStateVisible).toBeTruthy()
  })

  test('should create a new deck', async ({ page }) => {
    await page.goto('/decks')

    // デッキ作成ボタンを探してクリック
    const createButton = page.getByRole('button', {
      name: /create|作成|new deck|新しいデッキ|追加/i,
    })
    await createButton.click()

    // デッキ作成フォームが表示されることを確認
    const deckNameInput = page.locator(
      'input[name="name"], input[name="deckName"]'
    )
    await expect(deckNameInput).toBeVisible({ timeout: 5000 })

    // デッキ名を入力
    const deckName = `Test Deck ${Date.now()}`
    await deckNameInput.fill(deckName)

    // デッキタイプまたはその他のフィールドが存在する場合は入力
    const deckTypeInput = page.locator(
      'input[name="deckType"], select[name="deckType"]'
    )
    if (await deckTypeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deckTypeInput.first().click()
      // 最初のオプションを選択
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
    }

    // 保存ボタンをクリック
    const saveButton = page.getByRole('button', {
      name: /save|保存|create|作成/i,
    })
    await saveButton.click()

    // デッキが作成されたことを確認（成功メッセージまたはリストに表示）
    await expect(
      page.getByText(deckName, { exact: false })
    ).toBeVisible({ timeout: 5000 })
  })

  test('should edit a deck', async ({ page }) => {
    await page.goto('/decks')

    // 最初にデッキを作成
    const createButton = page.getByRole('button', {
      name: /create|作成|new deck|新しいデッキ|追加/i,
    })
    await createButton.click()

    const deckNameInput = page.locator(
      'input[name="name"], input[name="deckName"]'
    )
    await expect(deckNameInput).toBeVisible({ timeout: 5000 })

    const originalDeckName = `Original Deck ${Date.now()}`
    await deckNameInput.fill(originalDeckName)

    const saveButton = page.getByRole('button', {
      name: /save|保存|create|作成/i,
    })
    await saveButton.click()

    // デッキが作成されるまで待つ
    await expect(
      page.getByText(originalDeckName, { exact: false })
    ).toBeVisible({ timeout: 5000 })

    // 編集ボタンを探してクリック
    const editButton = page
      .getByRole('button', { name: /edit|編集/i })
      .first()

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click()

      // デッキ名を変更
      const editDeckNameInput = page.locator(
        'input[name="name"], input[name="deckName"]'
      )
      await expect(editDeckNameInput).toBeVisible({ timeout: 5000 })

      const newDeckName = `Updated Deck ${Date.now()}`
      await editDeckNameInput.clear()
      await editDeckNameInput.fill(newDeckName)

      // 保存
      const updateButton = page.getByRole('button', {
        name: /save|保存|update|更新/i,
      })
      await updateButton.click()

      // 更新されたデッキ名が表示されることを確認
      await expect(
        page.getByText(newDeckName, { exact: false })
      ).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('should delete a deck', async ({ page }) => {
    await page.goto('/decks')

    // 最初にデッキを作成
    const createButton = page.getByRole('button', {
      name: /create|作成|new deck|新しいデッキ|追加/i,
    })
    await createButton.click()

    const deckNameInput = page.locator(
      'input[name="name"], input[name="deckName"]'
    )
    await expect(deckNameInput).toBeVisible({ timeout: 5000 })

    const deckName = `Deck to Delete ${Date.now()}`
    await deckNameInput.fill(deckName)

    const saveButton = page.getByRole('button', {
      name: /save|保存|create|作成/i,
    })
    await saveButton.click()

    // デッキが作成されるまで待つ
    await expect(
      page.getByText(deckName, { exact: false })
    ).toBeVisible({ timeout: 5000 })

    // 削除ボタンを探してクリック
    const deleteButton = page
      .getByRole('button', { name: /delete|削除/i })
      .first()

    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click()

      // 確認ダイアログが表示される場合は確認
      const confirmButton = page.getByRole('button', {
        name: /confirm|確認|yes|はい|delete|削除/i,
      })

      if (
        await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await confirmButton.click()
      }

      // デッキが削除されたことを確認（リストから消える）
      await expect(
        page.getByText(deckName, { exact: false })
      ).not.toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })
})
