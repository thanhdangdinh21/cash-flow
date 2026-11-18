import type { Account, AccountType, Prisma } from '@prisma/client';

// System counter-leg accounts, find-or-created per (user, type, currency).
// All flagged is_system so they never appear in lists or pickers.
export const SYSTEM_ACCOUNT_NAMES: Record<AccountType, string> = {
  ASSET: 'Receivables',
  LIABILITY: 'Payables',
  INCOME: 'General income',
  EXPENSE: 'General expense',
  EQUITY: 'Opening balances',
};

/**
 * Looks up the user's system account of `type` in `currencyCode`, creating it
 * (plus its OWNER membership row) on first use. Call inside the caller's
 * Prisma transaction so the account and the entry that needs it land together.
 */
export async function findOrCreateSystemAccount(
  tx: Prisma.TransactionClient,
  userId: string,
  type: AccountType,
  currencyCode: string,
): Promise<Account> {
  const existing = await tx.account.findFirst({
    where: {
      ownerId: userId,
      isSystem: true,
      type,
      currencyCode,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  const account = await tx.account.create({
    data: {
      ownerId: userId,
      name: SYSTEM_ACCOUNT_NAMES[type],
      type,
      currencyCode,
      isSystem: true,
    },
  });
  await tx.accountUser.create({
    data: { accountId: account.id, userId, role: 'OWNER' },
  });
  return account;
}
