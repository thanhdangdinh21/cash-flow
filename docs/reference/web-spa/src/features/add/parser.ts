/* Quick-add grammar for the command bar:
     "blue bottle 6.75 @dining"          → expense, Dining
     "acme payroll +2480 @salary"        → income, Salary
     "lunch 14 @dining #cash"            → expense from Cash wallet
   Merchant = leftover words · amount = last bare number ("+" = income) ·
   @token = category · #token = account. */
import type { AppState, Category } from "../../data/types";

export interface ParsedQuickAdd {
  merchant: string;
  amount: number; // positive magnitude
  income: boolean;
  category?: Category;
  accountId: string;
}

function matchCategory(state: AppState, token: string): Category | undefined {
  const q = token.toLowerCase();
  const starts = (c: Category) => c.label.toLowerCase().startsWith(q) || c.id.toLowerCase().startsWith(q);
  // Prefer a top-level match, then children.
  return state.categories.find((c) => !c.parentId && starts(c)) ?? state.categories.find(starts);
}

function matchAccount(state: AppState, token: string): string | undefined {
  const q = token.toLowerCase();
  return state.accounts.find(
    (a) => (a.type === "Asset" || a.type === "Liability") && a.name.toLowerCase().includes(q),
  )?.id;
}

function defaultAccountId(state: AppState): string {
  return (
    state.accounts.find((a) => a.type === "Asset" && a.sub && !a.commodity) ??
    state.accounts.find((a) => a.type === "Asset")
  )?.id ?? "checking";
}

export function parseQuickAdd(state: AppState, input: string): ParsedQuickAdd | null {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  let category: Category | undefined;
  let accountId: string | undefined;
  let amount: number | undefined;
  let income = false;
  const merchantWords: string[] = [];

  for (const w of words) {
    if (w.startsWith("@") && w.length > 1) {
      category = matchCategory(state, w.slice(1)) ?? category;
      continue;
    }
    if (w.startsWith("#") && w.length > 1) {
      accountId = matchAccount(state, w.slice(1)) ?? accountId;
      continue;
    }
    const m = /^([+-]?)\$?(\d+(?:[.,]\d{1,2})?)$/.exec(w);
    if (m) {
      amount = parseFloat(m[2].replace(",", "."));
      income = m[1] === "+";
      continue;
    }
    merchantWords.push(w);
  }

  if (amount === undefined || amount <= 0 || !merchantWords.length) return null;

  const merchant = merchantWords
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  if (!income && category?.type === "Income") income = true;

  return { merchant, amount, income, category, accountId: accountId ?? defaultAccountId(state) };
}
