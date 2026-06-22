import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { monthRange } from '../month-range';

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

@Injectable()
export class SpendingByCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    opts: { from?: string; to?: string; direction?: 'out' | 'in' },
  ) {
    const { start: defaultStart, end: defaultEnd } = monthRange();
    const start = opts.from ? new Date(opts.from) : defaultStart;
    const end = opts.to ? new Date(opts.to) : defaultEnd;
    const type = opts.direction === 'in' ? 'INCOME' : 'EXPENSE';

    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionType: type,
        excludeFromReports: false,
        date: { gte: start, lt: end },
      },
      select: {
        amount: true,
        subCategory: {
          select: {
            category: { select: { id: true, name: true, icon: true } },
          },
        },
      },
    });

    const byCat = new Map<
      string,
      {
        categoryId: string | null;
        name: string;
        icon: string | null;
        amount: number;
      }
    >();
    let total = 0;
    for (const r of rows) {
      const amount = Number(r.amount);
      total += amount;
      const cat = r.subCategory?.category ?? null;
      const key = cat?.id ?? '__uncategorized__';
      const item = byCat.get(key) ?? {
        categoryId: cat?.id ?? null,
        name: cat?.name ?? 'Uncategorized',
        icon: cat?.icon ?? null,
        amount: 0,
      };
      item.amount += amount;
      byCat.set(key, item);
    }

    const elapsedDays = Math.max(
      1,
      Math.ceil(
        (Math.min(Date.now(), end.getTime()) - start.getTime()) / 86_400_000,
      ),
    );

    return {
      total,
      dailyAverage: total / elapsedDays,
      items: [...byCat.values()].sort((a, b) => b.amount - a.amount),
    };
  }
}

@Injectable()
export class CategoryTrendUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, categoryId: string, months = 6) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');

    const now = new Date();
    const startBoundary = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
    );
    const type = category.accountType === 'INCOME' ? 'INCOME' : 'EXPENSE';

    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionType: type,
        excludeFromReports: false,
        date: { gte: startBoundary },
        subCategory: { categoryId },
      },
      select: { amount: true, date: true },
    });

    const byMonth = new Map<number, number>();
    for (const r of rows) {
      const key = r.date.getUTCFullYear() * 12 + r.date.getUTCMonth();
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r.amount));
    }

    const series: { label: string; value: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      );
      const key = d.getUTCFullYear() * 12 + d.getUTCMonth();
      series.push({
        label: MONTH_LABELS[d.getUTCMonth()],
        value: byMonth.get(key) ?? 0,
      });
    }

    const thisMonth = series[series.length - 1]?.value ?? 0;
    const average =
      series.reduce((s, p) => s + p.value, 0) / (series.length || 1);

    return {
      category: { id: category.id, name: category.name, icon: category.icon },
      thisMonth,
      average,
      series,
    };
  }
}
