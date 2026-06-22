import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateBudgetDto, UpdateBudgetDto } from '../dtos/budget.dtos';

export function monthRange(month?: string): { start: Date; end: Date } {
  // month = "YYYY-MM"; defaults to the current month (UTC)
  const now = new Date();
  const [y, m] = month
    ? month.split('-').map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  if (!y || !m || m < 1 || m > 12)
    throw new BadRequestException('month must be YYYY-MM');
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

// Spent = sum of EXPENSE transactions in the month whose subcategory belongs
// to the budget's category (exclude_from_reports rows never qualify).
export async function spentByCategory(
  prisma: PrismaService,
  userId: string,
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      transactionType: 'EXPENSE',
      excludeFromReports: false,
      date: { gte: start, lt: end },
      subCategoryId: { not: null },
    },
    select: { amount: true, subCategory: { select: { categoryId: true } } },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.subCategory!.categoryId;
    map.set(key, (map.get(key) ?? 0) + Number(r.amount));
  }
  return map;
}

@Injectable()
export class ListBudgetsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, month?: string) {
    const { start, end } = monthRange(month);
    const [budgets, spent] = await Promise.all([
      this.prisma.budget.findMany({
        where: { userId },
        include: { category: { select: { id: true, name: true, icon: true } } },
        orderBy: { category: { name: 'asc' } },
      }),
      spentByCategory(this.prisma, userId, start, end),
    ]);
    return budgets.map((b) => ({ ...b, spent: spent.get(b.categoryId) ?? 0 }));
  }
}

@Injectable()
export class CreateBudgetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');
    const existing = await this.prisma.budget.findUnique({
      where: { userId_categoryId: { userId, categoryId: dto.categoryId } },
    });
    if (existing)
      throw new ConflictException('A budget for this category already exists');
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        monthlyLimit: dto.monthlyLimit,
      },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });
  }
}

@Injectable()
export class UpdateBudgetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    return this.prisma.budget.update({
      where: { id },
      data: { monthlyLimit: dto.monthlyLimit },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });
  }
}

@Injectable()
export class DeleteBudgetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    await this.prisma.budget.delete({ where: { id } });
  }
}
