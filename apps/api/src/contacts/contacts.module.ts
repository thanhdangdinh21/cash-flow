import { Module } from '@nestjs/common';
import {
  ListContactsUseCase,
  FindOrCreateContactUseCase,
  ListContactLoansUseCase,
} from './application/use-cases/contact.use-cases';
import { ContactsController } from './presentation/contacts.controller';

@Module({
  providers: [
    ListContactsUseCase,
    FindOrCreateContactUseCase,
    ListContactLoansUseCase,
  ],
  controllers: [ContactsController],
  exports: [FindOrCreateContactUseCase],
})
export class ContactsModule {}
