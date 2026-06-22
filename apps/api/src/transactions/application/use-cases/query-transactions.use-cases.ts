import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const LIST_INCLUDE = {
  debitAccount: {
    select: { id: true, name: true, type: true, isSystem: true },
  },
  creditAccount: {
    select: { id: true, name: true, type: true, isSystem: true },
  },
  subCategory: {
    include: { category: { select: { id: true, name: true, icon: true } } },
  },
  loan: {
    select: { id: true, direction: true, remainingAmount: true, status: true },
  },
  contact: { select: { id: true, name: true } },
} satisfies Prisma.TransactionInclude;

export interface ListTransactionsQuery {
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, q: ListTransactionsQuery) {
    const limit = Math.min(q.limit ?? 50, 100);
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      ...(q.accountId && {
        OR: [{ debitAccountId: q.accountId }, { creditAccountId: q.accountId }],
      }),
      ...(q.categoryId && { subCategory: { categoryId: q.categoryId } }),
      ...((q.from || q.to) && {
        date: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
    };

    const items = await this.prisma.transaction.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }
}

@Injectable()
export class GetTransactionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const txn = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...LIST_INCLUDE,
        loan: true,
        contact: { select: { id: true, name: true, balance: true } },
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.userId !== userId) throw new ForbiddenException();
    return txn;
  }
}
