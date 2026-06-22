import { Injectable } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SeedDefaultAccountsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, currencyCode = 'USD'): Promise<void> {
    // General income/expense are system accounts: bookkeeping counter-legs
    // hidden from the user's account list and pickers
    const defaults = [
      { name: 'Cash wallet', type: AccountType.ASSET, isSystem: false },
      { name: 'General income', type: AccountType.INCOME, isSystem: true },
      { name: 'General expense', type: AccountType.EXPENSE, isSystem: true },
    ];

    await this.prisma.$transaction(async (tx) => {
      for (const d of defaults) {
        const account = await tx.account.create({
          data: {
            ownerId: userId,
            name: d.name,
            type: d.type,
            currencyCode,
            isDefault: true,
            isSystem: d.isSystem,
          },
        });
        await tx.accountUser.create({
          data: { accountId: account.id, userId, role: 'OWNER' },
        });
      }
    });
  }
}
