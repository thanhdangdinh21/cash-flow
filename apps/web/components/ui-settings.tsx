'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

interface UiSettings {
  theme: Theme;
  density: Density;
  showKeyHints: boolean;
}

interface UiSettingsState extends UiSettings {
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setShowKeyHints: (show: boolean) => void;
}

const STORAGE_KEY = 'mf-ui';

const DEFAULT_SETTINGS: UiSettings = {
  theme: 'light',
  density: 'comfortable',
  showKeyHints: true,
};

function readStoredSettings(): UiSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      showKeyHints: typeof parsed.showKeyHints === 'boolean' ? parsed.showKeyHints : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const UiSettingsContext = createContext<UiSettingsState | null>(null);

export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(readStoredSettings);
  const { theme, density, showKeyHints } = settings;

  useEffect(() => {
    // Keep in sync with the pre-paint script in public/mf-ui-init.js.
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-density', density);
    root.setAttribute('data-hints', showKeyHints ? 'on' : 'off');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, density, showKeyHints }));
    } catch {
      // ignore write failures (e.g. private mode storage quota)
    }
  }, [theme, density, showKeyHints]);

  const value = useMemo<UiSettingsState>(
    () => ({
      theme,
      density,
      showKeyHints,
      setTheme: (t) => setSettings((s) => ({ ...s, theme: t })),
      setDensity: (d) => setSettings((s) => ({ ...s, density: d })),
      setShowKeyHints: (show) => setSettings((s) => ({ ...s, showKeyHints: show })),
    }),
    [theme, density, showKeyHints]
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings() {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) throw new Error('useUiSettings outside UiSettingsProvider');
  return ctx;
}
