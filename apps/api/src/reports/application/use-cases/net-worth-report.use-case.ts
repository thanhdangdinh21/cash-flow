import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { balanceDelta } from '../../../transactions/application/balance.helpers';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Net worth series derived by replaying journal-entry deltas backwards from
// the live balances — cheap at v1 scale; NetWorthSnapshot is the escape hatch.
@Injectable()
export class NetWorthReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, period: 'month' | 'year' = 'month') {
    const points = period === 'month' ? 6 : 12;
    const now = new Date();
    // Month boundaries, oldest first; the last boundary is the start of next month
    const boundaries: Date[] = [];
    for (let i = points - 1; i >= -1; i--) {
      boundaries.push(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)),
      );
    }

    const [accounts, entries] = await Promise.all([
      this.prisma.account.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
          type: { in: ['ASSET', 'LIABILITY'] },
        },
        select: { id: true, type: true, currentBalance: true },
      }),
      this.prisma.journalEntry.findMany({
        where: {
          account: { ownerId: userId, type: { in: ['ASSET', 'LIABILITY'] } },
          transaction: { date: { gte: boundaries[0] } },
        },
        select: {
          type: true,
          amount: true,
          account: { select: { type: true } },
          transaction: { select: { date: true } },
        },
      }),
    ]);

    const current = accounts.reduce((s, a) => {
      const v = Number(a.currentBalance);
      return s + (a.type === 'ASSET' ? v : -v);
    }, 0);

    // Net-worth delta per month bucket (asset deltas add, liability subtract)
    const monthDelta = new Map<number, number>();
    for (const e of entries) {
      const d = e.transaction.date;
      const key = d.getUTCFullYear() * 12 + d.getUTCMonth();
      const delta = balanceDelta(e.account.type, e.type, Number(e.amount));
      const signed = e.account.type === 'ASSET' ? delta : -delta;
      monthDelta.set(key, (monthDelta.get(key) ?? 0) + signed);
    }

    // Walk backwards: value at end of month M = value at end of M+1 − delta(M+1)
    const series: { label: string; value: number }[] = [];
    let value = current;
    for (let i = points - 1; i >= 0; i--) {
      const monthStart = boundaries[i];
      const key = monthStart.getUTCFullYear() * 12 + monthStart.getUTCMonth();
      series.unshift({ label: MONTH_LABELS[monthStart.getUTCMonth()], value });
      value -= monthDelta.get(key) ?? 0;
    }

    return { current, series };
  }
}
