import type { TransactionData } from '@/lib/types';

// Display sign relative to the user's own accounts:
//   money in  (+1): debit leg is a real account, credit leg is system
//                   (INCOME, loan borrowed/collected)
//   money out (−1): credit leg is a real account, debit leg is system
//                   (EXPENSE, loan lent/repaid)
//   neutral    (0): both legs are real accounts (TRANSFER)
export function txnSign(t: TransactionData): 1 | -1 | 0 {
  const debitSystem = t.debitAccount.isSystem;
  const creditSystem = t.creditAccount.isSystem;
  if (!debitSystem && creditSystem) return 1;
  if (debitSystem && !creditSystem) return -1;
  return 0;
}

// The user's own account involved (the non-system leg); transfers show from → to
export function txnAccountLabel(t: TransactionData): string {
  if (t.transactionType === 'TRANSFER') {
    return `${t.creditAccount.name} → ${t.debitAccount.name}`;
  }
  return t.debitAccount.isSystem ? t.creditAccount.name : t.debitAccount.name;
}

export function txnTitle(t: TransactionData): string {
  if (t.description) return t.description;
  if (t.transactionType === 'LOAN' && t.contact) return t.contact.name;
  if (t.subCategory) return t.subCategory.category.name;
  return t.transactionType === 'TRANSFER' ? 'Transfer' : 'Uncategorized';
}

// Icon key for CategoryIcon: category icon, or a per-type fallback
export function txnIcon(t: TransactionData): string {
  if (t.subCategory) return t.subCategory.category.icon;
  if (t.transactionType === 'TRANSFER') return 'wallet';
  if (t.transactionType === 'LOAN') return 'users';
  if (t.transactionType === 'INCOME') return 'trendUp';
  return 'receipt';
}
