import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  monthRange,
  spentByCategory,
} from '../../../budgets/application/use-cases/budget.use-cases';

// Single aggregate powering the Home screen: hero, wallets, cash-flow weeks,
// budgets with progress, and the recent list — one round trip.
@Injectable()
export class HomeReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const { start, end } = monthRange();

    const [wallets, monthTxns, budgets, recent, spentMap] = await Promise.all([
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
      this.prisma.budget.findMany({
        where: { userId },
        include: { category: { select: { id: true, name: true, icon: true } } },
        orderBy: { category: { name: 'asc' } },
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
      spentByCategory(this.prisma, userId, start, end),
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

    const budgetsWithSpent = budgets.map((b) => ({
      ...b,
      spent: spentMap.get(b.categoryId) ?? 0,
    }));

    // Empty-budget prompt: the top-spend category that has no budget yet
    const budgeted = new Set(budgets.map((b) => b.categoryId));
    let suggestion: { categoryId: string; spent: number } | null = null;
    for (const [categoryId, spent] of spentMap) {
      if (budgeted.has(categoryId)) continue;
      if (!suggestion || spent > suggestion.spent)
        suggestion = { categoryId, spent };
    }
    const budgetSuggestion = suggestion
      ? {
          ...suggestion,
          category: await this.prisma.category.findUnique({
            where: { id: suggestion.categoryId },
            select: { id: true, name: true, icon: true },
          }),
        }
      : null;

    return {
      totalAssets,
      monthIncome,
      monthSpent,
      net: monthIncome - monthSpent,
      weeks,
      wallets,
      budgets: budgetsWithSpent,
      budgetSuggestion,
      recent,
    };
  }
}
