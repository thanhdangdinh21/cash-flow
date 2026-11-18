/**
 * The two headline money figures and their parts.
 *
 * - inYourAccounts = assets − liabilities: money in the user's own accounts.
 *   Loans don't count: borrowing raises it, lending lowers it.
 * - netWorth = inYourAccounts + owedToYou − youOwe: everything owned minus
 *   everything owed, including the hidden loan Receivables / Payables accounts.
 *
 * EQUITY, INCOME and EXPENSE accounts are excluded from both. Loan interest
 * is not accrued. Amounts are summed as-is across currencies (no conversion yet).
 */
export class NetWorthSummaryDto {
  /**
   * Sum of the user's visible (non-system) ASSET account balances.
   * @example 920
   */
  assets: number;

  /**
   * Sum of the user's visible (non-system) LIABILITY account balances.
   * @example 0
   */
  liabilities: number;

  /**
   * assets − liabilities: money in the user's own accounts, ignoring loans.
   * @example 920
   */
  inYourAccounts: number;

  /**
   * Balance of the system Receivables account: loan principal contacts still owe you.
   * @example 150
   */
  owedToYou: number;

  /**
   * Balance of the system Payables account: loan principal you still owe contacts.
   * @example 20
   */
  youOwe: number;

  /**
   * inYourAccounts + owedToYou − youOwe.
   * @example 1050
   */
  netWorth: number;
}
