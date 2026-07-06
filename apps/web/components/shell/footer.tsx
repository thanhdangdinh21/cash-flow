"use client";

import { useTranslation } from "react-i18next";

const HINTS = [
  { keys: "G D", labelKey: "web.shell.hints.dashboard" },
  { keys: "N", labelKey: "web.shell.hints.newTransaction" },
  { keys: "T", labelKey: "web.shell.hints.transfer" },
  { keys: "A", labelKey: "web.shell.hints.newAccount" },
  { keys: "⌘K", labelKey: "web.shell.hints.command" },
] as const;

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="kbd-hint flex h-10 shrink-0 items-center gap-4 border-t border-line px-6">
      {HINTS.map((hint) => (
        <span
          key={hint.keys}
          className="flex items-center gap-1.5 text-xs text-ink-3"
        >
          <kbd className="eyebrow rounded-xs border border-line-2 bg-surface-2 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-ink-2">
            {hint.keys}
          </kbd>
          {t(hint.labelKey)}
        </span>
      ))}
    </footer>
  );
}
