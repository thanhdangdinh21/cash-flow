import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACCOUNT_REPOSITORY } from '../../domain/account.repository.interface';
import type { IAccountRepository } from '../../domain/account.repository.interface';
import type { HoldingEntity } from '../../domain/account.entity';
import type { CreateHoldingDto } from '../dtos/create-holding.dto';

@Injectable()
export class CreateHoldingUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: IAccountRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, accountId: string, dto: CreateHoldingDto): Promise<HoldingEntity> {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new NotFoundException('Account not found');
    if (account.ownerId !== userId) throw new ForbiddenException();
    if (account.deletedAt) throw new BadRequestException('Account is deleted');
    return this.prisma.holding.create({
      data: { accountId, name: dto.name, unitName: dto.unitName },
    }) as Promise<HoldingEntity>;
  }
}
