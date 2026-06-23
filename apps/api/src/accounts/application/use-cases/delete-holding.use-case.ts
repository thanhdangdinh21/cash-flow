import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DeleteHoldingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    accountId: string,
    holdingId: string,
  ): Promise<void> {
    const holding = await this.prisma.holding.findUnique({
      where: { id: holdingId },
      include: { account: true },
    });
    if (!holding || holding.accountId !== accountId)
      throw new NotFoundException('Holding not found');
    if (holding.account.ownerId !== userId) throw new ForbiddenException();
    if (holding.deletedAt)
      throw new BadRequestException('Holding is already deleted');
    const hasEntries = await this.prisma.journalEntry.count({
      where: { holdingId, deletedAt: null },
    });
    if (hasEntries > 0)
      throw new BadRequestException(
        'Cannot delete a holding that has journal entries',
      );
    await this.prisma.holding.update({
      where: { id: holdingId },
      data: { deletedAt: new Date() },
    });
  }
}
