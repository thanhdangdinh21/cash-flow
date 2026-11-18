/**
 * Net worth and its parts. Net worth = all ASSET balances − all LIABILITY
 * balances, including the hidden loan Receivables / Payables accounts.
 * EQUITY, INCOME and EXPENSE accounts are excluded. Amounts are summed as-is
 * across currencies (no conversion yet).
 */
export class NetWorthSummaryDto {
  /**
   * Sum of the user's visible (non-system) ASSET account balances.
   * @example 2307.5
   */
  assets: number;

  /**
   * Sum of the user's visible (non-system) LIABILITY account balances.
   * @example 0
   */
  liabilities: number;

  /**
   * Balance of the system Receivables account: money contacts still owe you.
   * @example 150
   */
  owedToYou: number;

  /**
   * Balance of the system Payables account: money you still owe contacts.
   * @example 0
   */
  youOwe: number;

  /**
   * assets + owedToYou − liabilities − youOwe.
   * @example 2457.5
   */
  netWorth: number;
}
