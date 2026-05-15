import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/account.repository.interface';
import type { IAccountRepository } from '../../domain/account.repository.interface';

@Injectable()
export class ListAccountsUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accounts: IAccountRepository) {}

  execute(userId: string) {
    return this.accounts.findAllActiveByOwner(userId);
  }
}
