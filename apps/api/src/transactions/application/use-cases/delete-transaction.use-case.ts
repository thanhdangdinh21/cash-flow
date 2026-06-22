import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { balanceDelta } from '../balance.helpers';

// Hard delete with atomic reversal of every side effect.
// Documented deviation from the journal-immutability rule: pre-snapshots, a
// deleted mistake should vanish from Activity entirely; counter-transactions
// can replace this once snapshot jobs exist.
@Injectable()
export class DeleteTransactionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const txn = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        journalEntries: { include: { account: true, holding: true } },
        loan: true,
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.userId !== userId) throw new ForbiddenException();

    const amount = Number(txn.amount);

    await this.prisma.$transaction(async (tx) => {
      for (const entry of txn.journalEntries) {
        await tx.account.update({
          where: { id: entry.accountId },
          data: {
            currentBalance: {
              decrement: balanceDelta(
                entry.account.type,
                entry.type,
                Number(entry.amount),
              ),
            },
          },
        });
        if (entry.holdingId && entry.quantity) {
          const qty = Number(entry.quantity);
          const wasPurchase = entry.type === 'DEBIT';
          // Purchases reverse exactly (cost = amount). Sales restore cost at
          // the holding's current average — a documented v1 approximation,
          // since the original average isn't stored.
          const h = entry.holding!;
          const currentQty = Number(h.currentQuantity);
          const avg = currentQty > 0 ? Number(h.currentCost) / currentQty : 0;
          await tx.holding.update({
            where: { id: entry.holdingId },
            data: {
              currentQuantity: { increment: wasPurchase ? -qty : qty },
              currentCost: {
                increment: wasPurchase ? -Number(entry.amount) : avg * qty,
              },
            },
          });
        }
      }

      if (txn.loan) {
        const [earliest, txCount] = await Promise.all([
          tx.transaction.findFirst({
            where: { loanId: txn.loan.id },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          }),
          tx.transaction.count({ where: { loanId: txn.loan.id } }),
        ]);
        const isOrigin = earliest?.id === txn.id;
        if (isOrigin && txCount > 1) {
          throw new BadRequestException(
            'Delete the settlement transactions before deleting the loan itself',
          );
        }

        // Contact balance: undo this transaction's delta. Origin LENT added
        // +amount; settlement of LENT subtracted; mirrored for BORROWED.
        const originSign = txn.loan.direction === 'LENT' ? 1 : -1;
        const delta = (isOrigin ? originSign : -originSign) * amount;
        await tx.contact.update({
          where: { id: txn.loan.contactId },
          data: { balance: { decrement: delta } },
        });

        if (isOrigin) {
          await tx.journalEntry.deleteMany({ where: { transactionId: id } });
          await tx.transaction.delete({ where: { id } });
          await tx.loan.delete({ where: { id: txn.loan.id } });
          return;
        }
        await tx.loan.update({
          where: { id: txn.loan.id },
          data: { remainingAmount: { increment: amount }, status: 'ACTIVE' },
        });
      }

      await tx.journalEntry.deleteMany({ where: { transactionId: id } });
      await tx.transaction.delete({ where: { id } });
    });
  }
}
