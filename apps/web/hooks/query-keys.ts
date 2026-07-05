// =============================================================================
// Central react-query key factory — single source of truth for every query
// key used across the web app's hooks. Keep keys as `as const` tuples/arrays
// so react-query's partial-matching invalidation works predictably.
//
// Reports keys all share the `["reports"]` prefix so invalidating with
// `queryClient.invalidateQueries({ queryKey: keys.reports.all })` hits every
// report query, regardless of its params.
// =============================================================================

import type {
  ListTransactionsParams,
  LoanStatus,
  NetWorthPeriod,
  SpendingByCategoryParams,
} from "@/lib/api/types";

export const keys = {
  accounts: ["accounts"] as const,
  account: (id: string) => ["accounts", id] as const,

  transactionsAll: ["transactions"] as const,
  transactions: (filters: ListTransactionsParams = {}) =>
    ["transactions", filters] as const,
  transaction: (id: string) => ["transactions", "detail", id] as const,

  categories: ["categories"] as const,

  contacts: ["contacts"] as const,
  contactLoans: (id: string, status?: LoanStatus) =>
    ["contacts", id, "loans", status] as const,

  me: ["me"] as const,

  reports: {
    all: ["reports"] as const,
    home: ["reports", "home"] as const,
    netWorth: (period: NetWorthPeriod = "month") =>
      ["reports", "net-worth", period] as const,
    spending: (params: SpendingByCategoryParams = {}) =>
      ["reports", "spending", params] as const,
    trend: (categoryId: string, months = 6) =>
      ["reports", "trend", categoryId, months] as const,
  },
};
