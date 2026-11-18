import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import axios from "axios";
import { api, TOKEN } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

export default function AppLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await TOKEN.get();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      try {
        // Confirm the token still works before showing the tabs, and seed the
        // `me` query so the screens don't fetch it again.
        const { data } = await api.get("/users/me");
        queryClient.setQueryData(["me"], data);
      } catch (err) {
        // 401: the api interceptor signs out and sends us to login. Stay on the
        // spinner. Anything else (offline, API down, 5xx) must not sign the
        // user out, so carry on into the app.
        if (axios.isAxiosError(err) && err.response?.status === 401) return;
      }
      if (!cancelled) setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#181712" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FAF9F6" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: "modal" }} />
    </Stack>
  );
}
