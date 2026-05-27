import '../global.css';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { initI18n, getI18n } from '@/lib/i18n';

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })
  );
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(async () => {
      setI18nReady(true);
      await SplashScreen.hideAsync();
    });
  }, []);

  if (!i18nReady) return null;

  return (
    <I18nextProvider i18n={getI18n()}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
