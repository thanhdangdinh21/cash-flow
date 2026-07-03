// =============================================================================
// Shared API types — mirrors apps/api response shapes.
//
// CRITICAL — Decimal serialization: Prisma `Decimal` fields (amounts,
// balances, quantities) have no global serialization interceptor applied in
// the API (see apps/api/src/main.ts, app.module.ts). decimal.js's `Decimal`
// class defines `toJSON()` returning `.toString()`, so these fields arrive
// over HTTP as JSON **strings**, not numbers. Verified empirically against
// the live API on 2026-07-03:
//   - Account.initialBalance / currentBalance          -> string  (e.g. "0", "-25.5")
//   - Transaction.amount                                -> string  (e.g. "25.5")
//   - Contact.balance                                   -> string
//   - Loan.principal / remainingAmount / interestRate   -> string
//   - Holding.currentQuantity / currentCost             -> string
// Screens must call Number(...) (or a shared parser) before formatting.
//
// By contrast, report use-cases (home, net-worth, spending-by-category,
// category-trend) compute their aggregate numbers in JS via `Number(...)`
// before returning, so those specific fields ARE numbers already — EXCEPT
// `HomeReport.wallets[].currentBalance`, which is a raw passthrough Account
// field and therefore still a string. Each type below documents this per field.
//
// Dates (createdAt/updatedAt/deletedAt/date) arrive as ISO 8601 strings.
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (mirror prisma/schema.prisma)
// -----------------------------------------------------------------------------

export type AccountType = "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";

export type AccountRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export type JournalEntryType = "DEBIT" | "CREDIT";

export type SnapshotPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER" | "LOAN";

export type LoanStatus = "ACTIVE" | "SETTLED";

export type LoanDirection = "LENT" | "BORROWED";

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Shared by POST /auth/register and POST /auth/login
export interface AuthResponse {
  accessToken: string;
  language: string;
}

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language: string;
  theme: string;
  notificationsOn: boolean;
}

export interface UpdateUserInput {
  language?: string;
}

// -----------------------------------------------------------------------------
// Accounts / Holdings
// -----------------------------------------------------------------------------

export interface Holding {
  id: string;
  accountId: string;
  name: string;
  unitName: string;
  /** Decimal — string over the wire, e.g. "5.00000000" */
  currentQuantity: string;
  /** Decimal — string over the wire, e.g. "300.0000" */
  currentCost: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  ownerId: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  /** Decimal — string over the wire */
  initialBalance: string;
  /** Decimal — string over the wire */
  currentBalance: string;
  isActive: boolean;
  isDefault: boolean;
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on GET list/detail/create responses (which `include: { holdings }`).
  // Absent on PATCH /accounts/:id, whose repository `update()` returns the
  // bare Prisma row with no include — verified empirically.
  holdings?: Holding[];
}

// One purchase/sale lot for a holding — from GET /accounts/:id `lots`.
export interface AccountHoldingLot {
  id: string;
  type: JournalEntryType;
  /** Decimal — string over the wire */
  amount: string;
  /** Decimal — string over the wire, null for non-commodity legs */
  quantity: string | null;
  holdingId: string | null;
  transaction: { id: string; date: string };
}

// GET /accounts/:id — Account + this month's flow + recent commodity lots.
export interface AccountDetail extends Account {
  holdings: Holding[];
  /** Computed via Number(...) in the use-case — already a number */
  monthIn: number;
  /** Computed via Number(...) in the use-case — already a number */
  monthOut: number;
  lots: AccountHoldingLot[];
}

export interface CreateHoldingInput {
  name: string;
  unitName: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currencyCode: string;
  initialBalance?: number;
  holdings?: CreateHoldingInput[];
}

export interface UpdateAccountInput {
  name?: string;
}

// -----------------------------------------------------------------------------
// Categories / SubCategories
// -----------------------------------------------------------------------------

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  accountType: AccountType | null;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subCategories: SubCategory[];
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  accountType?: AccountType;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  accountType?: AccountType | null;
}

export interface CreateSubCategoryInput {
  name: string;
}

// -----------------------------------------------------------------------------
// Contacts / Loans
// -----------------------------------------------------------------------------

export interface Contact {
  id: string;
  name: string;
  /** Decimal — string over the wire. > 0 = they owe you, < 0 = you owe them */
  balance: string;
}

export interface CreateContactInput {
  name: string;
}

export interface Loan {
  id: string;
  userId: string;
  contactId: string;
  direction: LoanDirection;
  /** Decimal — string over the wire */
  principal: string;
  /** Decimal — string over the wire */
  remainingAmount: string;
  /** Decimal — string over the wire, or null */
  interestRate: string | null;
  interestPeriod: string | null;
  status: LoanStatus;
  date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------

// Minimal account projection embedded on transactions (debit/credit legs)
export interface TransactionAccountRef {
  id: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
}

export interface TransactionCategoryRef {
  id: string;
  name: string;
  icon: string;
}

export interface TransactionSubCategoryRef {
  id: string;
  categoryId: string;
  name: string;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: TransactionCategoryRef;
}

export interface TransactionContactRef {
  id: string;
  name: string;
  /** Only present on GET /transactions/:id (detail include adds `balance`) */
  balance?: string;
}

// Loan summary embedded on list/create responses (subset of fields)
export interface TransactionLoanRef {
  id: string;
  direction: LoanDirection;
  /** Decimal — string over the wire */
  remainingAmount: string;
  status: LoanStatus;
}

export interface Transaction {
  id: string;
  userId: string;
  transactionType: TransactionType;
  debitAccountId: string;
  creditAccountId: string;
  subCategoryId: string | null;
  description: string | null;
  notes: string | null;
  /** Decimal — string over the wire, e.g. "25.5" */
  amount: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  excludeFromReports: boolean;
  loanId: string | null;
  contactId: string | null;
  recurringRuleId: string | null;
  debitAccount: TransactionAccountRef;
  creditAccount: TransactionAccountRef;
  subCategory: TransactionSubCategoryRef | null;
  // On list/create: TransactionLoanRef | null. On GET :id: full Loan | null
  // (detail include uses `loan: true`). Typed as the union of both.
  loan: TransactionLoanRef | Loan | null;
  contact: TransactionContactRef | null;
}

export interface TransactionListResponse {
  items: Transaction[];
  nextCursor: string | null;
}

export interface ListTransactionsParams {
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateTransactionInput {
  transactionType: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  counterAccountId?: string;
  subCategoryId?: string;
  loanDirection?: LoanDirection;
  loanId?: string;
  contactId?: string;
  contactName?: string;
  interestRate?: number;
  interestPeriod?: string;
  description?: string;
  notes?: string;
  holdingId?: string;
  quantity?: number;
  excludeFromReports?: boolean;
}

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------

// Wallet projection embedded in the home report — a raw Account passthrough
// (not run through Number()), so currentBalance stays a Decimal string.
export interface HomeReportWallet {
  id: string;
  name: string;
  currencyCode: string;
  /** Decimal — string over the wire (NOT converted by the use-case) */
  currentBalance: string;
}

export interface HomeReportWeek {
  label: string;
  income: number;
  spent: number;
}

export interface HomeReport {
  totalAssets: number;
  monthIncome: number;
  monthSpent: number;
  net: number;
  weeks: HomeReportWeek[];
  wallets: HomeReportWallet[];
  recent: Transaction[];
}

export type NetWorthPeriod = "month" | "year";

export interface NetWorthSeriesPoint {
  label: string;
  value: number;
}

export interface NetWorthReport {
  current: number;
  series: NetWorthSeriesPoint[];
}

export type SpendingDirection = "out" | "in";

export interface SpendingByCategoryItem {
  categoryId: string | null;
  name: string;
  icon: string | null;
  amount: number;
}

export interface SpendingByCategoryReport {
  total: number;
  dailyAverage: number;
  items: SpendingByCategoryItem[];
}

export interface SpendingByCategoryParams {
  from?: string;
  to?: string;
  direction?: SpendingDirection;
}

export interface CategoryTrendReport {
  category: { id: string; name: string; icon: string };
  thisMonth: number;
  average: number;
  series: NetWorthSeriesPoint[];
}
