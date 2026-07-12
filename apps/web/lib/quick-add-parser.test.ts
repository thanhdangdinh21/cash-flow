import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./quick-add-parser";
import type { Account, Category } from "./api/types";

function account(name: string, overrides: Partial<Account> = {}): Account {
  return {
    id: `acc-${name}`,
    ownerId: "user-1",
    name,
    type: "ASSET",
    currencyCode: "USD",
    initialBalance: "0",
    currentBalance: "0",
    isActive: true,
    isDefault: false,
    isSystem: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function category(
  name: string,
  accountType: Category["accountType"],
  subNames: string[]
): Category {
  return {
    id: `cat-${name}`,
    userId: "user-1",
    name,
    icon: "circle",
    accountType,
    isDefault: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    subCategories: subNames.map((n) => ({
      id: `sub-${n}`,
      categoryId: `cat-${name}`,
      name: n,
      isDefault: false,
      deletedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })),
  };
}

const wallet = account("Wallet");
const cash = account("Cash");
const goldStash = account("Gold stash", { type: "ASSET" });

const foodAndDrink = category("Food & Drink", "EXPENSE", ["Coffee", "Dining"]);
const salary = category("Salary", "INCOME", ["Paycheck"]);
const uncategorized = category("Uncategorized", null, []);

const accounts = [wallet, cash, goldStash];
const categories = [foodAndDrink, salary, uncategorized];

describe("parseQuickAdd", () => {
  it("parses an expense with a subcategory match and defaults to the first ASSET account", () => {
    const result = parseQuickAdd({ accounts, categories }, "blue bottle 6.75 @dining");
    expect(result).toMatchObject({
      merchant: "Blue Bottle",
      amount: 6.75,
      income: false,
      subCategoryId: "sub-Dining",
      accountId: "acc-Wallet",
    });
  });

  it("parses income from a '+' amount prefix", () => {
    const result = parseQuickAdd({ accounts, categories }, "acme payroll +2480 @salary");
    expect(result).toMatchObject({
      merchant: "Acme Payroll",
      amount: 2480,
      income: true,
    });
  });

  it("infers income from an INCOME-type category match even without a '+' prefix", () => {
    const result = parseQuickAdd({ accounts, categories }, "payroll 2480 @salary");
    expect(result?.income).toBe(true);
    expect(result?.subCategoryId).toBe("sub-Paycheck");
  });

  it("matches a category by its own name, not just a subcategory name", () => {
    // "@salary" matches the category "Salary" (not a subcategory name) — falls
    // back to that category's first subcategory.
    const result = parseQuickAdd({ accounts, categories }, "bonus 500 @salary");
    expect(result?.subCategoryId).toBe("sub-Paycheck");
  });

  it("matches an account by name via a '#' token", () => {
    const result = parseQuickAdd({ accounts, categories }, "lunch 14 @dining #cash");
    expect(result?.accountId).toBe("acc-Cash");
  });

  it("keeps parsing when the category token matches nothing", () => {
    const result = parseQuickAdd({ accounts, categories }, "mystery fee 3 @nonexistent");
    expect(result).toMatchObject({ merchant: "Mystery Fee", amount: 3, income: false });
    expect(result?.subCategoryId).toBeUndefined();
  });

  it("returns null when there is no amount token", () => {
    expect(parseQuickAdd({ accounts, categories }, "blue bottle @dining")).toBeNull();
  });

  it("returns null when there is no merchant text", () => {
    expect(parseQuickAdd({ accounts, categories }, "6.75 @dining")).toBeNull();
  });

  it("returns null for an empty or whitespace-only input", () => {
    expect(parseQuickAdd({ accounts, categories }, "   ")).toBeNull();
  });

  it("returns null when amount is zero or negative", () => {
    expect(parseQuickAdd({ accounts, categories }, "coffee 0 @dining")).toBeNull();
  });

  it("falls back to the first ASSET account when no account token matches", () => {
    const result = parseQuickAdd({ accounts, categories }, "coffee 3 @dining #nonexistent");
    expect(result?.accountId).toBe("acc-Wallet");
  });

  it("capitalizes each merchant word", () => {
    const result = parseQuickAdd({ accounts, categories }, "blue bottle coffee 6.75");
    expect(result?.merchant).toBe("Blue Bottle Coffee");
  });
});
