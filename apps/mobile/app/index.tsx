import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { TOKEN } from "@/lib/api";

// With a stored token, go to the app; its guard checks the token is still valid
// (and sends us to login on 401). Without one, go straight to login.
export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    TOKEN.get().then((token) => setHasToken(!!token));
  }, []);

  if (hasToken === null) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#181712" />
      </View>
    );
  }

  return <Redirect href={hasToken ? "/(app)" : "/(auth)/login"} />;
}
