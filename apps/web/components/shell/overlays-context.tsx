"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type AddTransactionPreset = "expense" | "income" | "transfer" | "debt";

interface OverlaysState {
  openAddTransaction: (preset?: AddTransactionPreset) => void;
  openCreateAccount: () => void;
  openCommandBar: () => void;
}

const OverlaysContext = createContext<OverlaysState | null>(null);

/**
 * Placeholder overlays provider for Task 10.
 *
 * The topbar buttons and global shortcuts call into these actions, but the
 * actual modals (add-transaction, create-account, command bar) land in
 * Tasks 13/14/15. Until then every action surfaces a "coming soon" toast so
 * the shell is fully wired and navigable.
 */
export function OverlaysProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const value = useMemo<OverlaysState>(() => {
    const comingSoon = () => toast(t("web.shell.comingSoon"));
    return {
      openAddTransaction: () => comingSoon(),
      openCreateAccount: () => comingSoon(),
      openCommandBar: () => comingSoon(),
    };
  }, [t]);

  return <OverlaysContext.Provider value={value}>{children}</OverlaysContext.Provider>;
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays outside OverlaysProvider");
  return ctx;
}
