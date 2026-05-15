import { Injectable } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SeedDefaultAccountsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<void> {
    const defaults = [
      { name: 'Cash wallet', type: AccountType.ASSET },
      { name: 'General income', type: AccountType.INCOME },
      { name: 'General expense', type: AccountType.EXPENSE },
    ];

    await this.prisma.$transaction(async (tx) => {
      for (const d of defaults) {
        const account = await tx.account.create({
          data: {
            ownerId: userId,
            name: d.name,
            type: d.type,
            currencyCode: 'USD',
            isDefault: true,
          },
        });
        await tx.accountUser.create({
          data: { accountId: account.id, userId, role: 'OWNER' },
        });
      }
    });
  }
}
