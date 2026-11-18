import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/account.repository.interface';
import type { IAccountRepository } from '../../domain/account.repository.interface';
import type { AccountEntity } from '../../domain/account.entity';
import type { CreateAccountDto } from '../dtos/create-account.dto';
import { takesOpeningBalance } from '../../infrastructure/opening-balance';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: IAccountRepository,
  ) {}

  async execute(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    // initialBalance (>= 0) means "money in it" for an ASSET and "amount
    // owed" for a LIABILITY; other account types have no opening balance.
    if (dto.initialBalance && !takesOpeningBalance(dto.type)) {
      throw new BadRequestException(
        'initialBalance is only supported for ASSET and LIABILITY accounts',
      );
    }
    return this.accounts.create({
      ownerId: userId,
      name: dto.name,
      type: dto.type,
      currencyCode: dto.currencyCode,
      initialBalance: dto.initialBalance,
      holdings: dto.holdings,
    });
  }
}
