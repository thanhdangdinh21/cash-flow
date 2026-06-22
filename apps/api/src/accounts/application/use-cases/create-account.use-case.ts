import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/account.repository.interface';
import type { IAccountRepository } from '../../domain/account.repository.interface';
import type { AccountEntity } from '../../domain/account.entity';
import type { CreateAccountDto } from '../dtos/create-account.dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: IAccountRepository,
  ) {}

  execute(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
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
