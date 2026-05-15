import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TOKEN } from "@/lib/api";

export default function DashboardScreen() {
  const router = useRouter();

  async function handleLogout() {
    await TOKEN.clear();
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <Text className="text-3xl font-bold text-slate-900 mb-2">Dashboard</Text>
      <Text className="text-slate-500 mb-8">Coming soon — Phase 3</Text>
      <TouchableOpacity
        onPress={handleLogout}
        className="border border-slate-200 rounded-lg px-6 py-3 bg-white"
      >
        <Text className="text-slate-700 font-medium">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}
