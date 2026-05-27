import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJson from './locales/en.json';
import viJson from './locales/vi.json';
import './types';

export type { Locale } from '@repo/shared/i18n';
export { supportedLocales, defaultLocale } from '@repo/shared/i18n';

export interface I18nStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const STORAGE_KEY = 'i18n-locale';

export function createI18n(storage: I18nStorage, initialLocale: Locale = 'en') {
  const instance = i18next.createInstance();

  instance.use(initReactI18next).init({
    lng: initialLocale,
    fallbackLng: 'en',
    initImmediate: false,
    resources: {
      en: { translation: enJson },
      vi: { translation: viJson },
    },
    interpolation: { escapeValue: false },
  });

  instance.on('languageChanged', (lng) => {
    void storage.setItem(STORAGE_KEY, lng);
  });

  return instance;
}
