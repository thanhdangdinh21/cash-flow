export type AccountType = "Asset" | "Liability" | "Income" | "Expense";

/** Plain-language account kinds shown in Create account (chat-decided). */
export type AccountKind = "own" | "owe" | "commodity";

export interface CreditTerms {
  limit: number;
  apr: number; // percent
  statementDay: string; // e.g. "25th of the month"
  dueDay: string;
  minPayment: number;
  remind: boolean;
}

export interface CommodityLot {
  date: string; // display date, e.g. "Feb 12"
  qty: number;
  unit: number; // unit price
  total: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  seeded?: boolean;
  sub?: string; // e.g. "Checking ·· 4821"
  icon: string;
  commodity?: boolean;
  unit?: string;
  qty?: number;
  avgCost?: number;
  lots?: CommodityLot[];
  credit?: CreditTerms;
}

/** Single-table categories; hierarchy via parentId (null = top level). */
export interface Category {
  id: string;
  label: string;
  icon: string;
  tint: string;
  type: "Expense" | "Income";
  parentId: string | null;
  accountId: string; // seeded General income / General expense account
}

export type TxnType = "expense" | "income" | "transfer" | "debt";
export type DebtDir = "lent" | "borrowed" | "collected" | "repaid";

export interface Transaction {
  id: number;
  type: TxnType;
  merchant: string; // merchant / payee / description headline
  categoryId?: string; // expense & income
  amount: number; // signed: negative = money out
  date: string; // ISO yyyy-mm-dd
  time: string; // display, e.g. "2:14 PM"
  accountId: string; // from-account (to-account for income)
  toAccountId?: string; // transfer target
  contactName?: string; // debt counterparty
  debtDir?: DebtDir;
  interest?: string; // e.g. "2% · yearly"
  note?: string;
  attach?: string; // attachment file name
  recurring?: boolean;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export type Role = "Owner" | "Admin" | "Editor" | "Viewer";

export interface Member {
  id: string;
  name: string;
  role: Role;
  you?: boolean;
  pending?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  note: string;
}

export interface Settings {
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  kbdHints: boolean;
  sidebar: "paper" | "ink";
}

export interface AppState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  members: Member[];
  contacts: Contact[];
  netWorthHistory: { m: string; v: number }[]; // months before current
  settings: Settings;
  nextTxnId: number;
}
