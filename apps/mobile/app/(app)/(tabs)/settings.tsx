import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-paper">
      <View className="px-5 py-8 space-y-6">
        <Text className="font-sans-semibold text-2xl text-ink tracking-tight">
          {t('settings.title')}
        </Text>

        <View className="bg-surface rounded-lg border border-line p-5 space-y-4 mt-6">
          <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3">
            {t('settings.language')}
          </Text>
          <Text className="font-sans text-sm text-ink-2 mb-3 mt-2">
            {t('settings.languageLabel')}
          </Text>
          <LanguageSwitcher />
        </View>
      </View>
    </ScrollView>
  );
}
