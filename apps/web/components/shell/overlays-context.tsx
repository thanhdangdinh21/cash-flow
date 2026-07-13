"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AddTransactionModal } from "@/components/transactions/add-transaction-modal";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
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

/** Prefill produced by the contacts screen's "Record settlement" action. */
export interface SettleLoanPrefill {
  contactId: string;
  loanId: string;
  debtDir: "COLLECTED" | "REPAID";
}

interface OverlaysState {
  openAddTransaction: (preset?: AddTransactionPreset) => void;
  openAddTransactionPrefilled: (prefill: AddTransactionPrefill) => void;
  openSettleLoan: (prefill: SettleLoanPrefill) => void;
  openCreateAccount: () => void;
  openCommandBar: () => void;
}

const OverlaysContext = createContext<OverlaysState | null>(null);

/** Shell-level overlay state, mounted once in the (app) layout. */
export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddTransactionPreset | undefined>(undefined);
  const [addPrefill, setAddPrefill] = useState<AddTransactionPrefill | undefined>(undefined);
  const [settlePrefill, setSettlePrefill] = useState<SettleLoanPrefill | undefined>(undefined);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);

  const value = useMemo<OverlaysState>(
    () => ({
      openAddTransaction: (preset) => {
        setAddPreset(preset);
        setAddPrefill(undefined);
        setSettlePrefill(undefined);
        setAddOpen(true);
      },
      openAddTransactionPrefilled: (prefill) => {
        setAddPreset(undefined);
        setAddPrefill(prefill);
        setSettlePrefill(undefined);
        setAddOpen(true);
      },
      openSettleLoan: (prefill) => {
        setAddPreset(undefined);
        setAddPrefill(undefined);
        setSettlePrefill(prefill);
        setAddOpen(true);
      },
      openCreateAccount: () => setCreateAccountOpen(true),
      // Toggles rather than only opening — pressing Cmd/Ctrl+K again closes it.
      openCommandBar: () => setCmdOpen((prev) => !prev),
    }),
    []
  );

  return (
    <OverlaysContext.Provider value={value}>
      {children}
      <AddTransactionModal
        open={addOpen}
        preset={addPreset}
        prefill={addPrefill}
        settlePrefill={settlePrefill}
        onClose={() => setAddOpen(false)}
      />
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <CreateAccountModal open={createAccountOpen} onClose={() => setCreateAccountOpen(false)} />
    </OverlaysContext.Provider>
  );
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays outside OverlaysProvider");
  return ctx;
}
