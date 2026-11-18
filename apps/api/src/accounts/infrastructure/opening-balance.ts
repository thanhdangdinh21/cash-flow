import type { Account, Prisma } from '@prisma/client';
import { balanceDelta } from '../../transactions/application/balance.helpers';
import { findOrCreateSystemAccount } from './system-accounts';

/** Account types whose starting balance is posted as an opening entry. */
export const OPENING_BALANCE_TYPES = ['ASSET', 'LIABILITY'] as const;

export function takesOpeningBalance(type: Account['type']): boolean {
  return (OPENING_BALANCE_TYPES as readonly string[]).includes(type);
}

/**
 * Posts the opening-balance journal entry for a freshly created account
 * (see OPENING_BALANCE in the schema's TRANSACTION TYPE → REPORT ROUTING):
 *   ASSET     X → DEBIT the account,        CREDIT "Opening balances"
 *   LIABILITY X → DEBIT "Opening balances", CREDIT the account
 * Dated at the account's createdAt and excluded from in/out reports.
 * Must run inside the same Prisma transaction that created the account.
 */
export async function postOpeningBalance(
  tx: Prisma.TransactionClient,
  account: Account,
  amount: number,
) {
  const equity = await findOrCreateSystemAccount(
    tx,
    account.ownerId,
    'EQUITY',
    account.currencyCode,
  );
  const [debit, credit] =
    account.type === 'ASSET' ? [account, equity] : [equity, account];

  const transaction = await tx.transaction.create({
    data: {
      userId: account.ownerId,
      transactionType: 'OPENING_BALANCE',
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      amount,
      date: account.createdAt,
      excludeFromReports: true,
    },
  });

  for (const leg of [
    { account: debit, type: 'DEBIT' as const },
    { account: credit, type: 'CREDIT' as const },
  ]) {
    await tx.journalEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: leg.account.id,
        type: leg.type,
        amount,
      },
    });
    await tx.account.update({
      where: { id: leg.account.id },
      data: {
        currentBalance: {
          increment: balanceDelta(leg.account.type, leg.type, amount),
        },
      },
    });
  }
  return transaction;
}
