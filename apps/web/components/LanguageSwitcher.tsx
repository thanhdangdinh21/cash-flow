'use client';

import { useTranslation } from 'react-i18next';
import { supportedLocales } from '@repo/i18n';
import type { Locale } from '@repo/i18n';
import { api } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  async function handleChange(locale: string) {
    await i18n.changeLanguage(locale);
    api.patch('/users/me', { language: locale }).catch(() => {});
  }

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supportedLocales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_NAMES[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
