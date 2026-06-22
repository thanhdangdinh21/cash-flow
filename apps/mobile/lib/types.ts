// API response shapes. Prisma Decimal columns arrive as strings over JSON —
// run them through num() in lib/format.ts before doing math.

export type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'LOAN';
export type LoanDirection = 'LENT' | 'BORROWED';
export type LoanStatus = 'ACTIVE' | 'SETTLED';

export interface HoldingData {
  id: string;
  name: string;
  unitName: string;
  currentQuantity: string;
  currentCost: string;
}

export interface AccountData {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  initialBalance: string;
  currentBalance: string;
  isDefault?: boolean;
  holdings: HoldingData[];
}

export interface AccountDetailData extends AccountData {
  monthIn: number;
  monthOut: number;
  lots: {
    id: string;
    type: 'DEBIT' | 'CREDIT';
    amount: string;
    quantity: string | null;
    holdingId: string | null;
    transaction: { id: string; date: string };
  }[];
}

export interface SubCategoryData {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  accountType: AccountType | null;
  isDefault: boolean;
  subCategories: SubCategoryData[];
}

export interface ContactData {
  id: string;
  name: string;
  balance: string;
}

export interface LoanData {
  id: string;
  direction: LoanDirection;
  principal: string;
  remainingAmount: string;
  interestRate: string | null;
  interestPeriod: string | null;
  status: LoanStatus;
  date: string;
}

export interface TransactionAccountRef {
  id: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
}

export interface TransactionData {
  id: string;
  transactionType: TransactionType;
  amount: string;
  date: string;
  description: string | null;
  notes: string | null;
  excludeFromReports: boolean;
  debitAccount: TransactionAccountRef;
  creditAccount: TransactionAccountRef;
  subCategory: (SubCategoryData & { category: { id: string; name: string; icon: string } }) | null;
  loan: Pick<LoanData, 'id' | 'direction' | 'remainingAmount' | 'status'> | null;
  contact: { id: string; name: string } | null;
}

export interface TransactionListData {
  items: TransactionData[];
  nextCursor: string | null;
}

export interface BudgetData {
  id: string;
  categoryId: string;
  monthlyLimit: string;
  spent: number;
  category: { id: string; name: string; icon: string };
}

export interface HomeReportData {
  totalAssets: number;
  monthIncome: number;
  monthSpent: number;
  net: number;
  weeks: { label: string; income: number; spent: number }[];
  wallets: { id: string; name: string; currencyCode: string; currentBalance: string }[];
  budgets: BudgetData[];
  budgetSuggestion: {
    categoryId: string;
    spent: number;
    category: { id: string; name: string; icon: string } | null;
  } | null;
  recent: TransactionData[];
}

export interface NetWorthReportData {
  current: number;
  series: { label: string; value: number }[];
}

export interface SpendingReportData {
  total: number;
  dailyAverage: number;
  items: { categoryId: string | null; name: string; icon: string | null; amount: number }[];
}

export interface CategoryTrendData {
  category: { id: string; name: string; icon: string };
  thisMonth: number;
  average: number;
  series: { label: string; value: number }[];
  budget: { id: string; monthlyLimit: string } | null;
}
