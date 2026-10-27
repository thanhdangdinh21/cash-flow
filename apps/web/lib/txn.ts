// =============================================================================
// Shared transaction display helpers — ported from apps/mobile/lib/txn.ts and
// adapted to the web `Transaction` type. Direction facts verified against
// apps/api/src/transactions/application/use-cases/create-transaction.use-case.ts:
//   EXPENSE:  debit = system expense account, credit = user account
//   INCOME:   debit = user account,           credit = system income account
//   TRANSFER: debit = destination,            credit = source
//   LOAN:     one leg is a system account (Receivables/Payables) — lent/repaid
//             put the user's account on the credit leg (money out),
//             borrowed/collected put it on the debit leg (money in).
// =============================================================================

import type { Transaction } from "./api/types";

/**
 * Display sign relative to the user's own accounts:
 *   +1 money in  — debit leg is a real account, credit leg is system
 *                  (INCOME, loan borrowed/collected)
 *   −1 money out — credit leg is a real account, debit leg is system
 *                  (EXPENSE, loan lent/repaid)
 *    0 neutral   — both legs are real accounts (TRANSFER)
 */
export function txnSign(t: Transaction): 1 | -1 | 0 {
  const debitSystem = t.debitAccount.isSystem;
  const creditSystem = t.creditAccount.isSystem;
  if (!debitSystem && creditSystem) return 1;
  if (debitSystem && !creditSystem) return -1;
  return 0;
}

/** The user's own account involved (the non-system leg); transfers show from → to. */
export function txnAccountLabel(t: Transaction): string {
  if (t.transactionType === "TRANSFER") {
    return `${t.creditAccount.name} → ${t.debitAccount.name}`;
  }
  return t.debitAccount.isSystem ? t.creditAccount.name : t.debitAccount.name;
}

/**
 * Row title fallback chain: description → contact (loans) → category name.
 * Final fallbacks are caller-supplied so screens can pass translated strings.
 */
export function txnTitle(
  t: Transaction,
  labels: { transfer: string; uncategorized: string }
): string {
  if (t.description) return t.description;
  if (t.transactionType === "LOAN" && t.contact) return t.contact.name;
  if (t.subCategory) return t.subCategory.category.name;
  return t.transactionType === "TRANSFER" ? labels.transfer : labels.uncategorized;
}
