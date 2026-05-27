'use client';

import { createI18n, supportedLocales } from '@repo/i18n';
import type { I18nStorage, Locale } from '@repo/i18n';
import type { i18n as I18nInstance } from 'i18next';

const STORAGE_KEY = 'i18n-locale';

const localStorageAdapter: I18nStorage = {
  getItem: (key) =>
    Promise.resolve(typeof window !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key, value) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
    return Promise.resolve();
  },
};

const rawLocale =
  typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) ?? 'en') : 'en';

const savedLocale: Locale = (supportedLocales as readonly string[]).includes(rawLocale)
  ? (rawLocale as Locale)
  : 'en';

export const i18n: I18nInstance = createI18n(localStorageAdapter, savedLocale);
