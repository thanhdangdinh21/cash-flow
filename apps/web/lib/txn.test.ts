import { describe, expect, it } from "vitest";
import { txnAccountLabel, txnSign, txnTitle } from "./txn";
import type { Transaction, TransactionAccountRef } from "./api/types";

// ---------------------------------------------------------------------------
// Fixtures mirror the API's debit/credit assignment
// (apps/api/src/transactions/application/use-cases/create-transaction.use-case.ts):
//   EXPENSE:  debit = "General expense" (system), credit = user account
//   INCOME:   debit = user account,               credit = "General income" (system)
//   TRANSFER: debit = destination account,        credit = source account
//   LOAN LENT (new) / REPAID (settle BORROWED):   money out — user account on credit
//   LOAN BORROWED (new) / COLLECTED (settle LENT): money in — user account on debit
// ---------------------------------------------------------------------------

function accountRef(
  name: string,
  overrides: Partial<TransactionAccountRef> = {}
): TransactionAccountRef {
  return { id: `acc-${name}`, name, type: "ASSET", isSystem: false, ...overrides };
}

const cash = accountRef("Cash wallet");
const savings = accountRef("Savings");
const generalExpense = accountRef("General expense", { type: "EXPENSE", isSystem: true });
const generalIncome = accountRef("General income", { type: "INCOME", isSystem: true });
const receivables = accountRef("Receivables", { type: "ASSET", isSystem: true });
const payables = accountRef("Payables", { type: "LIABILITY", isSystem: true });

function txn(overrides: Partial<Transaction>): Transaction {
  return {
    id: "txn-1",
    userId: "user-1",
    transactionType: "EXPENSE",
    debitAccountId: "d",
    creditAccountId: "c",
    subCategoryId: null,
    description: null,
    notes: null,
    amount: "25.5",
    date: "2026-07-05T00:00:00.000Z",
    createdAt: "2026-07-05T00:00:00.000Z",
    updatedAt: "2026-07-05T00:00:00.000Z",
    excludeFromReports: false,
    loanId: null,
    contactId: null,
    recurringRuleId: null,
    debitAccount: generalExpense,
    creditAccount: cash,
    subCategory: null,
    loan: null,
    contact: null,
    ...overrides,
  };
}

const expense = txn({});
const income = txn({
  transactionType: "INCOME",
  debitAccount: cash,
  creditAccount: generalIncome,
});
const transfer = txn({
  transactionType: "TRANSFER",
  debitAccount: savings, // destination
  creditAccount: cash, // source
});
const loanLent = txn({
  transactionType: "LOAN",
  debitAccount: receivables,
  creditAccount: cash,
  contactId: "contact-1",
  contact: { id: "contact-1", name: "Minh" },
});
const loanBorrowed = txn({
  transactionType: "LOAN",
  debitAccount: cash,
  creditAccount: payables,
  contactId: "contact-1",
  contact: { id: "contact-1", name: "Minh" },
});
const loanCollected = txn({
  transactionType: "LOAN",
  debitAccount: cash,
  creditAccount: receivables,
  contactId: "contact-1",
  contact: { id: "contact-1", name: "Minh" },
});
const loanRepaid = txn({
  transactionType: "LOAN",
  debitAccount: payables,
  creditAccount: cash,
  contactId: "contact-1",
  contact: { id: "contact-1", name: "Minh" },
});

describe("txnSign", () => {
  it("EXPENSE is money out", () => {
    expect(txnSign(expense)).toBe(-1);
  });

  it("INCOME is money in", () => {
    expect(txnSign(income)).toBe(1);
  });

  it("TRANSFER between own accounts is neutral", () => {
    expect(txnSign(transfer)).toBe(0);
  });

  it("LOAN lent (new) is money out", () => {
    expect(txnSign(loanLent)).toBe(-1);
  });

  it("LOAN repaid (settling a borrow) is money out", () => {
    expect(txnSign(loanRepaid)).toBe(-1);
  });

  it("LOAN borrowed (new) is money in", () => {
    expect(txnSign(loanBorrowed)).toBe(1);
  });

  it("LOAN collected (settling a lend) is money in", () => {
    expect(txnSign(loanCollected)).toBe(1);
  });
});

describe("txnAccountLabel", () => {
  it("TRANSFER renders source → destination (credit → debit)", () => {
    expect(txnAccountLabel(transfer)).toBe("Cash wallet → Savings");
  });

  it("EXPENSE shows the user's account (credit leg)", () => {
    expect(txnAccountLabel(expense)).toBe("Cash wallet");
  });

  it("INCOME shows the user's account (debit leg)", () => {
    expect(txnAccountLabel(income)).toBe("Cash wallet");
  });

  it("LOAN shows the non-system leg, never Receivables/Payables", () => {
    expect(txnAccountLabel(loanLent)).toBe("Cash wallet");
    expect(txnAccountLabel(loanBorrowed)).toBe("Cash wallet");
    expect(txnAccountLabel(loanCollected)).toBe("Cash wallet");
    expect(txnAccountLabel(loanRepaid)).toBe("Cash wallet");
  });
});

describe("txnTitle", () => {
  const labels = { transfer: "Transfer", uncategorized: "Uncategorized" };

  it("prefers the description", () => {
    expect(txnTitle(txn({ description: "Blue Bottle" }), labels)).toBe("Blue Bottle");
  });

  it("LOAN falls back to the contact name", () => {
    expect(txnTitle(loanLent, labels)).toBe("Minh");
  });

  it("categorized rows fall back to the category name", () => {
    const categorized = txn({
      subCategory: {
        id: "sub-1",
        categoryId: "cat-1",
        name: "Coffee",
        isDefault: false,
        deletedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        category: { id: "cat-1", name: "Dining", icon: "coffee" },
      },
    });
    expect(txnTitle(categorized, labels)).toBe("Dining");
  });

  it("TRANSFER falls back to the transfer label", () => {
    expect(txnTitle(transfer, labels)).toBe("Transfer");
  });

  it("everything else falls back to the uncategorized label", () => {
    expect(txnTitle(expense, labels)).toBe("Uncategorized");
  });
});
