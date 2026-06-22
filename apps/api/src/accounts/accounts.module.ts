import { Module } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from './domain/account.repository.interface';
import { AccountRepository } from './infrastructure/account.repository';
import { ListAccountsUseCase } from './application/use-cases/list-accounts.use-case';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case';
import { SeedDefaultAccountsUseCase } from './application/use-cases/seed-default-accounts.use-case';
import { CreateHoldingUseCase } from './application/use-cases/create-holding.use-case';
import { DeleteHoldingUseCase } from './application/use-cases/delete-holding.use-case';
import { GetAccountDetailUseCase } from './application/use-cases/get-account-detail.use-case';
import { AccountsController } from './presentation/accounts.controller';

@Module({
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: AccountRepository },
    ListAccountsUseCase,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    SeedDefaultAccountsUseCase,
    CreateHoldingUseCase,
    DeleteHoldingUseCase,
    GetAccountDetailUseCase,
  ],
  controllers: [AccountsController],
  exports: [SeedDefaultAccountsUseCase],
})
export class AccountsModule {}
