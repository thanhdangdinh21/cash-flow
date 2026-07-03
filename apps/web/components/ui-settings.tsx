'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
  const [theme, setTheme] = useState<Theme>(() => readStoredSettings().theme);
  const [density, setDensity] = useState<Density>(() => readStoredSettings().density);
  const [showKeyHints, setShowKeyHints] = useState<boolean>(() => readStoredSettings().showKeyHints);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', density);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, density, showKeyHints }));
    } catch {
      // ignore write failures (e.g. private mode storage quota)
    }
  }, [theme, density, showKeyHints]);

  return (
    <UiSettingsContext.Provider value={{ theme, density, showKeyHints, setTheme, setDensity, setShowKeyHints }}>
      {children}
    </UiSettingsContext.Provider>
  );
}

export function useUiSettings() {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) throw new Error('useUiSettings outside UiSettingsProvider');
  return ctx;
}
