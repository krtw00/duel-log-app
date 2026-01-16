import { ref, computed } from 'vue'
import { i18nObject } from './i18n-util'
import { loadLocaleAsync } from './i18n-util.async'
import type { Locales, TranslationFunctions } from './i18n-types'

export type { Locales, TranslationFunctions }

export type SupportedLocale = Locales

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ja', 'en', 'ko']

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
}

// 現在のロケールを保持するリアクティブな変数
const currentLocale = ref<Locales>('ja')
const LL = ref<TranslationFunctions | null>(null)

// ブラウザ言語から初期言語を決定
function getDefaultLocale(): SupportedLocale {
  // localStorageに保存された設定を優先
  const saved = localStorage.getItem('locale') as SupportedLocale
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  // ブラウザの言語設定を確認
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }

  // デフォルトは日本語
  return 'ja'
}

// ロケールを変更する関数
export async function setLocale(locale: Locales): Promise<void> {
  await loadLocaleAsync(locale)
  currentLocale.value = locale
  LL.value = i18nObject(locale)
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}

// 初期化
export async function initI18n(): Promise<void> {
  const defaultLocale = getDefaultLocale()
  await setLocale(defaultLocale)
}

// i18nコンテキストを取得するcomposable
export function useI18n() {
  return {
    LL: computed(() => LL.value),
    locale: computed(() => currentLocale.value),
    setLocale,
    locales: SUPPORTED_LOCALES,
    localeNames: LOCALE_NAMES,
  }
}

// 直接LLを取得するためのgetter
export function getLL(): TranslationFunctions | null {
  return LL.value
}

export function getLocale(): Locales {
  return currentLocale.value
}
