import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { TOKEN } from "@/lib/api";

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  async function handleLogout() {
    await TOKEN.clear();
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1 items-center justify-center bg-paper px-6">
      <Text className="font-mono-semibold text-2xs uppercase tracking-[2px] text-ink-3 mb-3">
        Money Flow
      </Text>
      <Text className="font-sans-semibold text-3xl text-ink mb-2 tracking-tight">
        {t("dashboard.title")}
      </Text>
      <Text className="font-sans text-ink-3 mb-8">{t("dashboard.comingSoon")}</Text>
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.7}
        className="h-11 border border-line-2 rounded-md px-6 bg-surface items-center justify-center"
      >
        <Text className="font-sans-semibold text-ink">{t("common.signOut")}</Text>
      </TouchableOpacity>
    </View>
  );
}
