/**
 * Quick-add grammar for the ⌘K command bar:
 *   "blue bottle 6.75 @dining"          → expense, Dining
 *   "acme payroll +2480 @salary"        → income, Salary
 *   "lunch 14 @dining #cash"            → expense from the Cash account
 * Merchant = leftover words · amount = the one bare number token
 * ("+" prefix = income) · @token = category or subcategory · #token = account.
 */
import type { Account, Category } from "./api/types";

export interface ParsedQuickAdd {
  merchant: string;
  amount: number; // positive magnitude
  income: boolean;
  subCategoryId?: string;
  subCategoryLabel?: string;
  accountId: string;
  accountName: string;
}

interface QuickAddData {
  accounts: Account[];
  categories: Category[];
}

interface SubCategoryMatch {
  id: string;
  label: string;
  isIncome: boolean;
}

function findSubCategoryMatch(
  categories: Category[],
  predicate: (name: string) => boolean
): SubCategoryMatch | undefined {
  for (const category of categories) {
    for (const sub of category.subCategories) {
      if (predicate(sub.name)) {
        return {
          id: sub.id,
          label: `${category.name} — ${sub.name}`,
          isIncome: category.accountType === "INCOME",
        };
      }
    }
  }
  return undefined;
}

function matchCategory(categories: Category[], token: string): SubCategoryMatch | undefined {
  const q = token.toLowerCase();

  // Prefer a subcategory name match, then a parent category name match
  // (falling back to that category's first subcategory) — "@dining" and
  // "@salary" should both work even though only one is a subcategory name.
  return (
    findSubCategoryMatch(categories, (name) => name.toLowerCase().startsWith(q)) ??
    matchByCategoryName(categories, (name) => name.toLowerCase().startsWith(q)) ??
    findSubCategoryMatch(categories, (name) => name.toLowerCase().includes(q)) ??
    matchByCategoryName(categories, (name) => name.toLowerCase().includes(q))
  );
}

function matchByCategoryName(
  categories: Category[],
  predicate: (name: string) => boolean
): SubCategoryMatch | undefined {
  for (const category of categories) {
    if (predicate(category.name) && category.subCategories.length > 0) {
      const sub = category.subCategories[0];
      if (sub) {
        return {
          id: sub.id,
          label: `${category.name} — ${sub.name}`,
          isIncome: category.accountType === "INCOME",
        };
      }
    }
  }
  return undefined;
}

function matchAccount(accounts: Account[], token: string): Account | undefined {
  const q = token.toLowerCase();
  return accounts.find(
    (a) =>
      (a.type === "ASSET" || a.type === "LIABILITY") && a.name.toLowerCase().includes(q)
  );
}

function defaultAccount(accounts: Account[]): Account | undefined {
  return accounts.find((a) => a.type === "ASSET");
}

const AMOUNT_TOKEN = /^([+-]?)\$?(\d+(?:[.,]\d{1,2})?)$/;

export function parseQuickAdd(data: QuickAddData, input: string): ParsedQuickAdd | null {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  let subCategory: SubCategoryMatch | undefined;
  let account: Account | undefined;
  let amount: number | undefined;
  let income = false;
  const merchantWords: string[] = [];

  for (const w of words) {
    if (w.startsWith("@") && w.length > 1) {
      subCategory = matchCategory(data.categories, w.slice(1)) ?? subCategory;
      continue;
    }
    if (w.startsWith("#") && w.length > 1) {
      account = matchAccount(data.accounts, w.slice(1)) ?? account;
      continue;
    }
    const m = AMOUNT_TOKEN.exec(w);
    if (m?.[1] !== undefined && m[2] !== undefined) {
      amount = parseFloat(m[2].replace(",", "."));
      income = m[1] === "+";
      continue;
    }
    merchantWords.push(w);
  }

  if (amount === undefined || amount <= 0 || !merchantWords.length) return null;

  const merchant = merchantWords
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

  if (!income && subCategory?.isIncome) income = true;

  const resolvedAccount = account ?? defaultAccount(data.accounts);

  return {
    merchant,
    amount,
    income,
    subCategoryId: subCategory?.id,
    subCategoryLabel: subCategory?.label,
    accountId: resolvedAccount?.id ?? "",
    accountName: resolvedAccount?.name ?? "",
  };
}
