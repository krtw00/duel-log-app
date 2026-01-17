/**
 * i18n 翻訳キー整合性チェックスクリプト
 *
 * 日本語(ja)をベースとして、英語(en)と韓国語(ko)の翻訳キーが
 * 一致しているかチェックします。
 */

import ja from '../src/i18n/ja/index.js';
import en from '../src/i18n/en/index.js';
import ko from '../src/i18n/ko/index.js';

type TranslationObject = Record<string, unknown>;

/**
 * オブジェクトからすべてのキーをフラット化して取得
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * 2つのキー配列を比較して差分を取得
 */
function findMissingKeys(baseKeys: string[], targetKeys: string[]): string[] {
  const targetSet = new Set(targetKeys);
  return baseKeys.filter((key) => !targetSet.has(key));
}

function findExtraKeys(baseKeys: string[], targetKeys: string[]): string[] {
  const baseSet = new Set(baseKeys);
  return targetKeys.filter((key) => !baseSet.has(key));
}

console.log('=== i18n Translation Key Check ===\n');

// 各言語のキーを取得
const jaKeys = getAllKeys(ja as TranslationObject);
const enKeys = getAllKeys(en as TranslationObject);
const koKeys = getAllKeys(ko as TranslationObject);

console.log(`[OK] Loaded ja/index.ts`);
console.log(`[OK] Loaded en/index.ts`);
console.log(`[OK] Loaded ko/index.ts\n`);

console.log(`Base language: ja (${jaKeys.length} keys)\n`);

let hasErrors = false;

// 英語チェック
console.log('--- en ---');
console.log(`Total keys: ${enKeys.length}`);
const enMissing = findMissingKeys(jaKeys, enKeys);
const enExtra = findExtraKeys(jaKeys, enKeys);

if (enMissing.length > 0) {
  hasErrors = true;
  console.log(`[ERROR] Missing keys (${enMissing.length}):`);
  enMissing.forEach((key) => console.log(`  - ${key}`));
}
if (enExtra.length > 0) {
  hasErrors = true;
  console.log(`[ERROR] Extra keys (${enExtra.length}):`);
  enExtra.forEach((key) => console.log(`  + ${key}`));
}
if (enMissing.length === 0 && enExtra.length === 0) {
  console.log('[OK] All keys match!');
}
console.log();

// 韓国語チェック
console.log('--- ko ---');
console.log(`Total keys: ${koKeys.length}`);
const koMissing = findMissingKeys(jaKeys, koKeys);
const koExtra = findExtraKeys(jaKeys, koKeys);

if (koMissing.length > 0) {
  hasErrors = true;
  console.log(`[ERROR] Missing keys (${koMissing.length}):`);
  koMissing.forEach((key) => console.log(`  - ${key}`));
}
if (koExtra.length > 0) {
  hasErrors = true;
  console.log(`[ERROR] Extra keys (${koExtra.length}):`);
  koExtra.forEach((key) => console.log(`  + ${key}`));
}
if (koMissing.length === 0 && koExtra.length === 0) {
  console.log('[OK] All keys match!');
}
console.log();

// 結果サマリー
console.log('=== Summary ===');
if (hasErrors) {
  console.log('[FAILED] Translation keys are out of sync!');
  process.exit(1);
} else {
  console.log('[PASSED] All translation keys are in sync!');
  process.exit(0);
}
