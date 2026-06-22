import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Account detail for the mobile screens: balance + this month's in/out flow
// + holdings with their purchase lots (DEBIT journal entries carrying qty).
@Injectable()
export class GetAccountDetailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, deletedAt: null },
      include: { holdings: { where: { deletedAt: null } } },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.ownerId !== userId) throw new ForbiddenException();

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const entries = await this.prisma.journalEntry.findMany({
      where: { accountId: id, transaction: { date: { gte: monthStart } } },
      select: { type: true, amount: true },
    });
    // For an asset account: DEBIT = money in, CREDIT = money out
    let monthIn = 0;
    let monthOut = 0;
    for (const e of entries) {
      if (e.type === 'DEBIT') monthIn += Number(e.amount);
      else monthOut += Number(e.amount);
    }

    const lots = account.holdings.length
      ? await this.prisma.journalEntry.findMany({
          where: { accountId: id, holdingId: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            amount: true,
            quantity: true,
            holdingId: true,
            transaction: { select: { id: true, date: true } },
          },
        })
      : [];

    return { ...account, monthIn, monthOut, lots };
  }
}
