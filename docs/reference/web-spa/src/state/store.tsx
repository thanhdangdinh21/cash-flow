import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Account, AppState, Category, Member, Role, Settings, Transaction } from "../data/types";
import { makeSeedState } from "../data/seed";

const STORAGE_KEY = "mfw-state-v1";
export const SESSION_KEY = "mfw-session";

export type Action =
  | { type: "ADD_TXN"; txn: Omit<Transaction, "id"> }
  | { type: "UPDATE_TXN"; txn: Transaction }
  | { type: "DELETE_TXN"; id: number }
  | { type: "ADD_ACCOUNT"; account: Account }
  | { type: "ADD_LOT"; accountId: string; qty: number; unitPrice: number; date: string }
  | { type: "ADD_CATEGORY"; category: Category }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "SET_BUDGET"; categoryId: string; limit: number }
  | { type: "INVITE_MEMBER"; name: string; role: Role }
  | { type: "SET_MEMBER_ROLE"; id: string; role: Role }
  | { type: "REMOVE_MEMBER"; id: string }
  | { type: "SET_SETTINGS"; settings: Partial<Settings> }
  | { type: "RESET" };

/** Apply a transaction's effect on account balances (dir = 1) or undo it (dir = -1). */
function applyTxn(accounts: Account[], t: Transaction, dir: 1 | -1): Account[] {
  return accounts.map((a) => {
    let delta = 0;
    if (a.id === t.accountId) delta += t.amount;
    if (t.type === "transfer" && a.id === t.toAccountId) delta += -t.amount;
    // Mirror into the seeded income/expense bucket accounts so their totals stay live.
    if (t.type === "expense" && a.id === "genexp") delta += -t.amount;
    if (t.type === "income" && a.id === "geninc") delta += t.amount;
    if (delta === 0) return a;
    return { ...a, balance: Math.round((a.balance + dir * delta) * 100) / 100 };
  });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TXN": {
      const txn: Transaction = { ...action.txn, id: state.nextTxnId };
      // A debt with a new counterparty also creates the contact.
      const needsContact =
        txn.type === "debt" && txn.contactName && !state.contacts.some((c) => c.name === txn.contactName);
      return {
        ...state,
        nextTxnId: state.nextTxnId + 1,
        transactions: [...state.transactions, txn],
        accounts: applyTxn(state.accounts, txn, 1),
        contacts: needsContact
          ? [...state.contacts, { id: `c${Date.now()}`, name: txn.contactName!, note: txn.note ?? "Debt / loan" }]
          : state.contacts,
      };
    }
    case "UPDATE_TXN": {
      const prev = state.transactions.find((t) => t.id === action.txn.id);
      if (!prev) return state;
      let accounts = applyTxn(state.accounts, prev, -1);
      accounts = applyTxn(accounts, action.txn, 1);
      return {
        ...state,
        accounts,
        transactions: state.transactions.map((t) => (t.id === action.txn.id ? action.txn : t)),
      };
    }
    case "DELETE_TXN": {
      const prev = state.transactions.find((t) => t.id === action.id);
      if (!prev) return state;
      return {
        ...state,
        accounts: applyTxn(state.accounts, prev, -1),
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    }
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.account] };
    case "ADD_LOT": {
      return {
        ...state,
        accounts: state.accounts.map((a) => {
          if (a.id !== action.accountId || !a.commodity) return a;
          const total = Math.round(action.qty * action.unitPrice * 100) / 100;
          const lots = [...(a.lots ?? []), { date: action.date, qty: action.qty, unit: action.unitPrice, total }];
          const qty = Math.round(((a.qty ?? 0) + action.qty) * 10) / 10;
          const cost = Math.round((a.balance + total) * 100) / 100;
          return { ...a, lots, qty, balance: cost, avgCost: Math.round((cost / qty) * 100) / 100 };
        }),
      };
    }
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.category] };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.category.id
            ? action.category
            : c.parentId === action.category.id
              ? { ...c, tint: action.category.tint, type: action.category.type, accountId: action.category.accountId }
              : c,
        ),
      };
    case "DELETE_CATEGORY": {
      const doomed = new Set([action.id, ...state.categories.filter((c) => c.parentId === action.id).map((c) => c.id)]);
      return {
        ...state,
        categories: state.categories.filter((c) => !doomed.has(c.id)),
        budgets: state.budgets.filter((b) => !doomed.has(b.categoryId)),
        // Transactions keep their history — they fall back to "Global".
        transactions: state.transactions.map((t) =>
          t.categoryId && doomed.has(t.categoryId) ? { ...t, categoryId: undefined } : t,
        ),
      };
    }
    case "SET_BUDGET": {
      const existing = state.budgets.find((b) => b.categoryId === action.categoryId);
      return {
        ...state,
        budgets: existing
          ? state.budgets.map((b) => (b.categoryId === action.categoryId ? { ...b, limit: action.limit } : b))
          : [...state.budgets, { categoryId: action.categoryId, limit: action.limit }],
      };
    }
    case "INVITE_MEMBER": {
      const member: Member = { id: `m${Date.now()}`, name: action.name, role: action.role, pending: true };
      return { ...state, members: [...state.members, member] };
    }
    case "SET_MEMBER_ROLE":
      return { ...state, members: state.members.map((m) => (m.id === action.id ? { ...m, role: action.role } : m)) };
    case "REMOVE_MEMBER":
      return { ...state, members: state.members.filter((m) => m.id !== action.id) };
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "RESET":
      return makeSeedState();
    default:
      return state;
  }
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* corrupted state — fall through to a fresh seed */
  }
  return makeSeedState();
}

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Reflect display settings onto <html> so the token CSS reacts.
  useEffect(() => {
    const el = document.documentElement;
    if (state.settings.theme === "dark") el.setAttribute("data-theme", "dark");
    else el.removeAttribute("data-theme");
    el.setAttribute("data-mfw-density", state.settings.density);
    el.setAttribute("data-mfw-kbd", state.settings.kbdHints ? "on" : "off");
    el.setAttribute("data-mfw-side", state.settings.sidebar);
  }, [state.settings]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}
