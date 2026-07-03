import type { AppState, Category, Transaction } from "../data/types";
import { monthKeyOf, parseISO } from "../data/format";

export function categoryById(state: AppState, id?: string): Category | undefined {
  return id ? state.categories.find((c) => c.id === id) : undefined;
}

/** Top-level ancestor of a category (itself if already top-level). */
export function topCategory(state: AppState, id?: string): Category | undefined {
  let c = categoryById(state, id);
  while (c?.parentId) c = categoryById(state, c.parentId) ?? c;
  return c;
}

export function accountById(state: AppState, id?: string) {
  return id ? state.accounts.find((a) => a.id === id) : undefined;
}

export function accountLabel(state: AppState, id?: string): string {
  const a = accountById(state, id);
  if (!a) return "—";
  return a.sub ? `${a.name} ·· ${a.sub.slice(-4)}` : a.name;
}

/** "Groceries · Supermarket" (parent · child) or just the label. */
export function categoryPath(state: AppState, id?: string): string {
  const c = categoryById(state, id);
  if (!c) return "Global";
  const parent = c.parentId ? categoryById(state, c.parentId) : undefined;
  return parent ? `${parent.label} · ${c.label}` : c.label;
}

export function monthTxns(state: AppState, monthKey: string): Transaction[] {
  return state.transactions
    .filter((t) => monthKeyOf(t.date) === monthKey)
    .sort((a, b) => (a.date === b.date ? timeSort(b.time) - timeSort(a.time) : b.date.localeCompare(a.date)));
}

function timeSort(t: string): number {
  const m = /(\d+):(\d+) (AM|PM)/.exec(t);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3] === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

export interface DayGroup {
  date: string;
  total: number;
  txns: Transaction[];
}

export function dayGroups(txns: Transaction[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const t of txns) {
    let g = map.get(t.date);
    if (!g) map.set(t.date, (g = { date: t.date, total: 0, txns: [] }));
    g.txns.push(t);
    g.total = Math.round((g.total + t.amount) * 100) / 100;
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Spend per top-level expense category for a month, descending. */
export function spendByCategory(state: AppState, monthKey: string): { cat: Category; amount: number }[] {
  const map = new Map<string, number>();
  for (const t of monthTxns(state, monthKey)) {
    if (t.type !== "expense") continue;
    const top = topCategory(state, t.categoryId);
    if (!top) continue;
    map.set(top.id, (map.get(top.id) ?? 0) + Math.abs(t.amount));
  }
  return [...map.entries()]
    .map(([id, amount]) => ({ cat: categoryById(state, id)!, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthIncome(state: AppState, monthKey: string): number {
  return sum(monthTxns(state, monthKey).filter((t) => t.type === "income").map((t) => t.amount));
}

export function monthSpent(state: AppState, monthKey: string): number {
  return sum(monthTxns(state, monthKey).filter((t) => t.type === "expense").map((t) => -t.amount));
}

function sum(ns: number[]): number {
  return Math.round(ns.reduce((s, n) => s + n, 0) * 100) / 100;
}

/** The three bank accounts shown as "Total balance" on the dashboard. */
export function bankAccounts(state: AppState) {
  return state.accounts.filter((a) => a.type === "Asset" && a.sub && !a.commodity);
}

export function totalAssets(state: AppState): number {
  return sum(state.accounts.filter((a) => a.type === "Asset").map((a) => a.balance));
}

export function totalLiabilities(state: AppState): number {
  return sum(state.accounts.filter((a) => a.type === "Liability").map((a) => a.balance));
}

export function netWorth(state: AppState): number {
  return sum([totalAssets(state), totalLiabilities(state)]);
}

/** Weekly in/out buckets for the cashflow chart (weeks starting the 1st/8th/15th/22nd). */
export function weeklyCashflow(state: AppState, monthKey: string): { label: string; spent: number; income: number }[] {
  const weeks = [1, 8, 15, 22].map((d) => ({ label: String(d), spent: 0, income: 0 }));
  for (const t of monthTxns(state, monthKey)) {
    const day = parseISO(t.date).getDate();
    const w = weeks[Math.min(3, Math.floor((day - 1) / 7))];
    if (t.type === "expense") w.spent += -t.amount;
    else if (t.type === "income") w.income += t.amount;
  }
  return weeks.map((w) => ({ ...w, spent: Math.round(w.spent), income: Math.round(w.income) }));
}

export interface BudgetRow {
  categoryId: string;
  label: string;
  spent: number;
  limit: number;
  over: boolean;
}

export function budgetRows(state: AppState, monthKey: string): BudgetRow[] {
  const spend = new Map(spendByCategory(state, monthKey).map((s) => [s.cat.id, s.amount]));
  return state.budgets
    .map((b) => {
      const cat = categoryById(state, b.categoryId);
      const spent = spend.get(b.categoryId) ?? 0;
      return { categoryId: b.categoryId, label: cat?.label ?? b.categoryId, spent, limit: b.limit, over: spent > b.limit };
    })
    .sort((a, b) => b.spent - a.spent);
}

/** Biggest unbudgeted top-level expense category this month (the "ghost row" prompt). */
export function unbudgetedPrompt(state: AppState, monthKey: string): { cat: Category; spent: number } | undefined {
  const budgeted = new Set(state.budgets.map((b) => b.categoryId));
  return spendByCategory(state, monthKey)
    .filter((s) => !budgeted.has(s.cat.id))
    .map((s) => ({ cat: s.cat, spent: s.amount }))[0];
}

/** Lending balance per contact, derived from debt transactions.
    Positive = they owe you; negative = you owe them. */
export function lendingBalance(state: AppState, contactName: string): number {
  let bal = 0;
  for (const t of state.transactions) {
    if (t.type !== "debt" || t.contactName !== contactName) continue;
    switch (t.debtDir) {
      case "lent": bal += Math.abs(t.amount); break;
      case "collected": bal -= Math.abs(t.amount); break;
      case "borrowed": bal -= Math.abs(t.amount); break;
      case "repaid": bal += Math.abs(t.amount); break;
    }
  }
  return Math.round(bal * 100) / 100;
}

/** Net-worth series: seeded history + live current month. */
export function netWorthSeries(state: AppState): { m: string; v: number }[] {
  return [...state.netWorthHistory, { m: "Mar", v: Math.round(netWorth(state)) }];
}

/** Monthly spend for one top-level category (used for the trend chart). */
export function categoryMonthSpend(state: AppState, categoryId: string, monthKey: string): number {
  let total = 0;
  for (const t of monthTxns(state, monthKey)) {
    if (t.type !== "expense") continue;
    if (topCategory(state, t.categoryId)?.id !== categoryId) continue;
    total += Math.abs(t.amount);
  }
  return Math.round(total);
}
