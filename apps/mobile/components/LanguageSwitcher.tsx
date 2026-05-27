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
            className={`px-4 py-2 rounded-lg border ${
              isActive
                ? 'bg-slate-900 border-slate-900'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isActive ? 'text-white' : 'text-slate-700'
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
