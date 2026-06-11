import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supportedLocales } from '@repo/i18n';
import type { Locale } from '@repo/i18n';
import { api } from '@/lib/api';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  async function handleSelect(locale: Locale) {
    await i18n.changeLanguage(locale);
    api.patch('/users/me', { language: locale }).catch(() => {});
  }

  return (
    <View className="flex-row gap-2 flex-wrap">
      {supportedLocales.map((locale) => {
        const isActive = i18n.language === locale;
        return (
          <TouchableOpacity
            key={locale}
            onPress={() => handleSelect(locale)}
            activeOpacity={0.7}
            className={`px-4 py-2.5 rounded-md border ${
              isActive ? 'bg-ink border-ink' : 'bg-surface border-line-2'
            }`}
          >
            <Text
              className={`font-sans-medium text-sm ${
                isActive ? 'text-paper' : 'text-ink-2'
              }`}
            >
              {LOCALE_NAMES[locale]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
