import { Injectable, NotFoundException } from '@nestjs/common';
import type { LoanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ListContactsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, balance: true },
    });
  }
}

// Find-or-create by name among the user's active contacts (soft-delete safe).
// Used directly by the transactions module when a LOAN transaction carries
// contactName instead of contactId. Accepts an optional transaction client so
// it can participate in the caller's prisma.$transaction.
@Injectable()
export class FindOrCreateContactUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, name: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const trimmed = name.trim();
    const existing = await db.contact.findFirst({
      where: {
        userId,
        deletedAt: null,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) return existing;
    return db.contact.create({ data: { userId, name: trimmed } });
  }
}

@Injectable()
export class ListContactLoansUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, contactId: string, status?: LoanStatus) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.loan.findMany({
      where: { contactId, userId, ...(status && { status }) },
      orderBy: { date: 'desc' },
    });
  }
}
