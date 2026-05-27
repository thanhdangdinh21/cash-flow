import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { createI18n } from '@repo/i18n';
import type { I18nStorage, Locale } from '@repo/i18n';

SplashScreen.preventAutoHideAsync();

const STORAGE_KEY = 'i18n-locale';

const asyncStorageAdapter: I18nStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};

let i18nInstance: ReturnType<typeof createI18n> | null = null;

export async function initI18n(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  i18nInstance = createI18n(asyncStorageAdapter, (saved as Locale) ?? 'en');
}

export function getI18n() {
  if (!i18nInstance) throw new Error('i18n not initialized — call initI18n() first');
  return i18nInstance;
}
