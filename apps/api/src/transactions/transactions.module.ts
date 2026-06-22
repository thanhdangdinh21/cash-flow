import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction.use-case';
import {
  GetTransactionUseCase,
  ListTransactionsUseCase,
} from './application/use-cases/query-transactions.use-cases';
import { TransactionsController } from './presentation/transactions.controller';

@Module({
  imports: [ContactsModule],
  providers: [
    CreateTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionUseCase,
    DeleteTransactionUseCase,
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
