import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { monthRange } from '../month-range';

// Single aggregate powering the Home screen: hero, wallets, cash-flow weeks,
// and the recent list — one round trip.
@Injectable()
export class HomeReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const { start, end } = monthRange();

    const [wallets, monthTxns, recent] = await Promise.all([
      this.prisma.account.findMany({
        where: {
          ownerId: userId,
          type: 'ASSET',
          isActive: true,
          deletedAt: null,
          isSystem: false,
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          currencyCode: true,
          currentBalance: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          excludeFromReports: false,
          transactionType: { in: ['EXPENSE', 'INCOME'] },
          date: { gte: start, lt: end },
        },
        select: { amount: true, transactionType: true, date: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: {
          debitAccount: {
            select: { id: true, name: true, type: true, isSystem: true },
          },
          creditAccount: {
            select: { id: true, name: true, type: true, isSystem: true },
          },
          subCategory: {
            include: {
              category: { select: { id: true, name: true, icon: true } },
            },
          },
          contact: { select: { id: true, name: true } },
        },
      }),
    ]);

    const totalAssets = wallets.reduce(
      (s, w) => s + Number(w.currentBalance),
      0,
    );

    let monthIncome = 0;
    let monthSpent = 0;
    // Weekly buckets labeled by the day-of-month their week (Mon-based) starts on
    const weekBuckets = new Map<
      number,
      { label: string; income: number; spent: number }
    >();
    for (const t of monthTxns) {
      const amount = Number(t.amount);
      if (t.transactionType === 'INCOME') monthIncome += amount;
      else monthSpent += amount;

      const d = new Date(t.date);
      const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
      const weekStart = Math.max(1, d.getUTCDate() - dow);
      const bucket = weekBuckets.get(weekStart) ?? {
        label: String(weekStart),
        income: 0,
        spent: 0,
      };
      if (t.transactionType === 'INCOME') bucket.income += amount;
      else bucket.spent += amount;
      weekBuckets.set(weekStart, bucket);
    }
    const weeks = [...weekBuckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, w]) => w);

    return {
      totalAssets,
      monthIncome,
      monthSpent,
      net: monthIncome - monthSpent,
      weeks,
      wallets,
      recent,
    };
  }
}
