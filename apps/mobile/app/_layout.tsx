import '../global.css';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  SplineSansMono_500Medium,
  SplineSansMono_600SemiBold,
} from '@expo-google-fonts/spline-sans-mono';
import { initI18n, getI18n } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { registerSessionHandling } from '@/lib/session';

// Registered at module load so it is in place before any screen fires a request.
registerSessionHandling();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    SplineSansMono_500Medium,
    SplineSansMono_600SemiBold,
  });

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  const ready = i18nReady && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <I18nextProvider i18n={getI18n()}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
