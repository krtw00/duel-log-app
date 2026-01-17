import { computed } from 'vue';
import { useI18n, SUPPORTED_LOCALES, LOCALE_NAMES, setLocale } from '@/i18n';
import type { SupportedLocale } from '@/i18n';

export function useLocale() {
  const { locale, LL } = useI18n();

  const currentLocale = computed(() => locale.value);
  const currentLocaleName = computed(() => LOCALE_NAMES[locale.value]);

  async function changeLocale(newLocale: SupportedLocale) {
    await setLocale(newLocale);
  }

  return {
    currentLocale,
    currentLocaleName,
    supportedLocales: SUPPORTED_LOCALES,
    localeNames: LOCALE_NAMES,
    changeLocale,
    LL,
  };
}
