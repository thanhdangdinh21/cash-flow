import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  IAccountRepository,
  CreateAccountWithHoldingsData,
  UpdateAccountData,
} from '../domain/account.repository.interface';
import type { AccountEntity } from '../domain/account.entity';

@Injectable()
export class AccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActiveByOwner(ownerId: string): Promise<AccountEntity[]> {
    return this.prisma.account.findMany({
      // System accounts (General income/expense, loan Receivables/Payables)
      // are bookkeeping plumbing — never shown in the user's account list
      where: { ownerId, isActive: true, deletedAt: null, isSystem: false },
      include: { holdings: { where: { deletedAt: null } } },
      orderBy: { createdAt: 'asc' },
    }) as Promise<AccountEntity[]>;
  }

  findById(id: string): Promise<AccountEntity | null> {
    return this.prisma.account.findFirst({
      where: { id, deletedAt: null },
    }) as Promise<AccountEntity | null>;
  }

  async create(data: CreateAccountWithHoldingsData): Promise<AccountEntity> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          ownerId: data.ownerId,
          name: data.name,
          type: data.type,
          currencyCode: data.currencyCode,
          initialBalance: data.initialBalance ?? 0,
          isDefault: data.isDefault ?? false,
        },
      });
      await tx.accountUser.create({
        data: { accountId: account.id, userId: data.ownerId, role: 'OWNER' },
      });
      if (data.holdings?.length) {
        await tx.holding.createMany({
          data: data.holdings.map((h) => ({
            accountId: account.id,
            name: h.name,
            unitName: h.unitName,
          })),
        });
      }
      return tx.account.findUnique({
        where: { id: account.id },
        include: { holdings: { where: { deletedAt: null } } },
      }) as Promise<AccountEntity>;
    });
  }

  update(id: string, data: UpdateAccountData): Promise<AccountEntity> {
    return this.prisma.account.update({
      where: { id },
      data,
    }) as Promise<AccountEntity>;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
