'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { i18n } from '@/lib/i18n';
import { UiSettingsProvider, useUiSettings } from '@/components/ui-settings';

function ThemedToaster() {
  const { theme } = useUiSettings();
  return <Toaster theme={theme} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      })
  );

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <UiSettingsProvider>
          {children}
          <ThemedToaster />
        </UiSettingsProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
