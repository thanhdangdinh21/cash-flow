import type { AccountType, JournalEntryType } from '@prisma/client';

// Normal balance side (see BALANCE CALCULATION REFERENCE in schema.prisma):
//   ASSET / EXPENSE          → DEBIT increases the balance
//   LIABILITY / INCOME / EQUITY → CREDIT increases the balance
export function balanceDelta(
  accountType: AccountType,
  entryType: JournalEntryType,
  amount: number,
): number {
  const debitNormal = accountType === 'ASSET' || accountType === 'EXPENSE';
  const increases = (entryType === 'DEBIT') === debitNormal;
  return increases ? amount : -amount;
}
