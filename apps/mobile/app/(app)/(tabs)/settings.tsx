import { View, Text, ScrollView } from 'react-native';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-4 py-8 space-y-6">
        <Text className="text-2xl font-bold text-slate-900">Settings</Text>

        <View className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Language
          </Text>
          <Text className="text-sm text-slate-700 mb-3">App Language</Text>
          <LanguageSwitcher />
        </View>
      </View>
    </ScrollView>
  );
}
