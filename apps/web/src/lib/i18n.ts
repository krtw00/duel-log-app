import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

const resources = {
  ja: { translation: ja },
  en: { translation: en },
  ko: { translation: ko },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') ?? 'ja',
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
