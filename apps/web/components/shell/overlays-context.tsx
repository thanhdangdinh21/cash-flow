"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { CommandBar } from "@/components/shell/command-bar";

export type AddTransactionPreset = "expense" | "income" | "transfer" | "debt";

/** Prefill produced by the ⌘K quick-add parser's "edit details first" action. */
export interface AddTransactionPrefill {
  type: "EXPENSE" | "INCOME";
  amountText: string;
  description: string;
  accountId: string;
  subCategoryId?: string;
}

interface OverlaysState {
  openAddTransaction: (preset?: AddTransactionPreset) => void;
  openAddTransactionPrefilled: (prefill: AddTransactionPrefill) => void;
  openCreateAccount: () => void;
  openCommandBar: () => void;
}

const OverlaysContext = createContext<OverlaysState | null>(null);

/**
 * Shell-level overlay state. `openAddTransaction`/`openAddTransactionPrefilled`
 * and the command bar are real (Tasks 13/14); create-account remains a
 * "coming soon" toast until Task 15 lands.
 */
export function OverlaysProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddTransactionPreset | undefined>(undefined);
  const [addPrefill, setAddPrefill] = useState<AddTransactionPrefill | undefined>(undefined);
  const [cmdOpen, setCmdOpen] = useState(false);

  const value = useMemo<OverlaysState>(() => {
    const comingSoon = () => toast(t("web.shell.comingSoon"));
    return {
      openAddTransaction: (preset) => {
        setAddPreset(preset);
        setAddPrefill(undefined);
        setAddOpen(true);
      },
      openAddTransactionPrefilled: (prefill) => {
        setAddPreset(undefined);
        setAddPrefill(prefill);
        setAddOpen(true);
      },
      openCreateAccount: () => comingSoon(),
      // Toggles rather than only opening — pressing Cmd/Ctrl+K again closes it.
      openCommandBar: () => setCmdOpen((prev) => !prev),
    };
  }, [t]);

  return (
    <OverlaysContext.Provider value={value}>
      {children}
      <AddTransactionModal
        open={addOpen}
        preset={addPreset}
        prefill={addPrefill}
        onClose={() => setAddOpen(false)}
      />
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </OverlaysContext.Provider>
  );
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays outside OverlaysProvider");
  return ctx;
}
