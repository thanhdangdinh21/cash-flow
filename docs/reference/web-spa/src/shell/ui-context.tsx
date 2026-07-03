import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEMO_MONTH } from "../data/seed";
import type { Transaction, TxnType } from "../data/types";

export type AddPrefill = Partial<Omit<Transaction, "id">> & { amountText?: string };

interface UiState {
  month: string;
  setMonth: (m: string) => void;
  addOpen: boolean;
  addPrefill: AddPrefill | null;
  editTxn: Transaction | null;
  openAdd: (type?: TxnType, prefill?: AddPrefill) => void;
  openEdit: (txn: Transaction) => void;
  closeAdd: () => void;
  cmdOpen: boolean;
  openCmd: () => void;
  closeCmd: () => void;
  createAccountOpen: boolean;
  setCreateAccountOpen: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const UiContext = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(DEMO_MONTH);
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState<AddPrefill | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openAdd = useCallback((type?: TxnType, prefill?: AddPrefill) => {
    setEditTxn(null);
    setAddPrefill({ ...(prefill ?? {}), ...(type ? { type } : {}) });
    setCmdOpen(false);
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((txn: Transaction) => {
    setAddPrefill(null);
    setEditTxn(txn);
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setAddPrefill(null);
    setEditTxn(null);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<UiState>(
    () => ({
      month, setMonth,
      addOpen, addPrefill, editTxn, openAdd, openEdit, closeAdd,
      cmdOpen, openCmd: () => setCmdOpen(true), closeCmd: () => setCmdOpen(false),
      createAccountOpen, setCreateAccountOpen,
      toast, showToast,
    }),
    [month, addOpen, addPrefill, editTxn, cmdOpen, createAccountOpen, toast, openAdd, openEdit, closeAdd, showToast],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi outside UiProvider");
  return ctx;
}
