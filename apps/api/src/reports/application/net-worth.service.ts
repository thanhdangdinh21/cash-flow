import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { NetWorthSummaryDto } from './dtos/net-worth-summary.dto';

// Decimal(18,4) balances summed as JS floats: trim float noise at the column's scale.
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

// The one place the headline money figures are computed (see NetWorthSummaryDto):
// - inYourAccounts: visible ASSET − visible LIABILITY balances; loans ignored,
//   so borrowing $20 raises it and lending $30 lowers it.
// - netWorth: all ASSET − all LIABILITY balances, including the system loan
//   accounts (Receivables = ASSET, Payables = LIABILITY), so lending or
//   borrowing leaves it unchanged.
@Injectable()
export class NetWorthService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string): Promise<NetWorthSummaryDto> {
    const accounts = await this.prisma.account.findMany({
      where: {
        ownerId: userId,
        isActive: true,
        deletedAt: null,
        type: { in: ['ASSET', 'LIABILITY'] },
      },
      select: { type: true, isSystem: true, currentBalance: true },
    });

    let assets = 0;
    let liabilities = 0;
    let owedToYou = 0;
    let youOwe = 0;
    for (const a of accounts) {
      const v = Number(a.currentBalance);
      if (a.type === 'ASSET') {
        if (a.isSystem) owedToYou += v;
        else assets += v;
      } else if (a.isSystem) youOwe += v;
      else liabilities += v;
    }

    const inYourAccounts = assets - liabilities;
    return {
      assets: round4(assets),
      liabilities: round4(liabilities),
      inYourAccounts: round4(inYourAccounts),
      owedToYou: round4(owedToYou),
      youOwe: round4(youOwe),
      netWorth: round4(inYourAccounts + owedToYou - youOwe),
    };
  }
}
