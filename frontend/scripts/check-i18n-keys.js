#!/usr/bin/env node

/**
 * i18n翻訳キーの整合性チェックスクリプト
 *
 * 機能:
 * 1. ja/en/ko の翻訳キーが一致しているか確認
 * 2. 不足しているキーを検出してレポート
 *
 * 使い方:
 *   node scripts/check-i18n-keys.js
 *
 * 終了コード:
 *   0: 全てのキーが一致
 *   1: 不足キーあり
 */

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 動的インポートで翻訳ファイルを読み込む
async function loadTranslations() {
  const i18nDir = join(__dirname, '..', 'src', 'i18n')
  const translations = {}

  // tsx を使ってTypeScriptファイルをインポート
  const jaModule = await import(join(i18nDir, 'ja', 'index.ts'))
  const enModule = await import(join(i18nDir, 'en', 'index.ts'))
  const koModule = await import(join(i18nDir, 'ko', 'index.ts'))

  translations.ja = jaModule.default
  translations.en = enModule.default
  translations.ko = koModule.default

  return translations
}

// オブジェクトから全てのキーパスを取得（再帰的に）
function getAllKeyPaths(obj, prefix = '') {
  const keys = []

  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeyPaths(value, fullPath))
    } else {
      keys.push(fullPath)
    }
  }

  return keys
}

// キーの差分を取得
function findMissingKeys(baseKeys, targetKeys) {
  const targetSet = new Set(targetKeys)
  return baseKeys.filter((key) => !targetSet.has(key))
}

// メイン処理
async function main() {
  const languages = ['ja', 'en', 'ko']

  console.log('=== i18n Translation Key Check ===\n')

  // 翻訳ファイルを読み込み
  let translations
  try {
    translations = await loadTranslations()
    for (const lang of languages) {
      console.log(`[OK] Loaded ${lang}/index.ts`)
    }
  } catch (error) {
    console.error(`[ERROR] Failed to load translation files: ${error.message}`)
    process.exit(1)
  }

  console.log('')

  // 各言語のキーを取得
  const keysByLang = {}
  for (const lang of languages) {
    keysByLang[lang] = getAllKeyPaths(translations[lang])
  }

  // 日本語をベースとして他言語との差分をチェック
  const baseLang = 'ja'
  const baseKeys = keysByLang[baseLang]
  let hasErrors = false

  console.log(`Base language: ${baseLang} (${baseKeys.length} keys)\n`)

  for (const lang of languages) {
    if (lang === baseLang) continue

    const targetKeys = keysByLang[lang]

    // ベースにあって対象にないキー（不足）
    const missingKeys = findMissingKeys(baseKeys, targetKeys)

    // 対象にあってベースにないキー（余分）
    const extraKeys = findMissingKeys(targetKeys, baseKeys)

    console.log(`--- ${lang} ---`)
    console.log(`Total keys: ${targetKeys.length}`)

    if (missingKeys.length > 0) {
      hasErrors = true
      console.log(`\n[MISSING] Keys in ${baseLang} but not in ${lang} (${missingKeys.length}):`)
      for (const key of missingKeys) {
        console.log(`  - ${key}`)
      }
    }

    if (extraKeys.length > 0) {
      hasErrors = true
      console.log(`\n[EXTRA] Keys in ${lang} but not in ${baseLang} (${extraKeys.length}):`)
      for (const key of extraKeys) {
        console.log(`  - ${key}`)
      }
    }

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log('[OK] All keys match!')
    }

    console.log('')
  }

  // 結果サマリー
  console.log('=== Summary ===')
  if (hasErrors) {
    console.log('[FAILED] Translation key mismatches found!')
    process.exit(1)
  } else {
    console.log('[PASSED] All translation keys are in sync!')
    process.exit(0)
  }
}

main()
