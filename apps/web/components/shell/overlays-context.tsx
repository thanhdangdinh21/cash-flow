"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";

export type AddTransactionPreset = "expense" | "income" | "transfer" | "debt";

interface OverlaysState {
  openAddTransaction: (preset?: AddTransactionPreset) => void;
  openCreateAccount: () => void;
  openCommandBar: () => void;
}

const OverlaysContext = createContext<OverlaysState | null>(null);

/**
 * Shell-level overlay state. `openAddTransaction` is real (Task 13); the
 * create-account and command-bar actions remain "coming soon" toasts until
 * Tasks 14/15 land.
 */
export function OverlaysProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddTransactionPreset | undefined>(undefined);

  const value = useMemo<OverlaysState>(() => {
    const comingSoon = () => toast(t("web.shell.comingSoon"));
    return {
      openAddTransaction: (preset) => {
        setAddPreset(preset);
        setAddOpen(true);
      },
      openCreateAccount: () => comingSoon(),
      openCommandBar: () => comingSoon(),
    };
  }, [t]);

  return (
    <OverlaysContext.Provider value={value}>
      {children}
      <AddTransactionModal
        open={addOpen}
        preset={addPreset}
        onClose={() => setAddOpen(false)}
      />
    </OverlaysContext.Provider>
  );
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays outside OverlaysProvider");
  return ctx;
}
