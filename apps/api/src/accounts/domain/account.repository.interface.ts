import type { AccountType } from '@prisma/client';
import type { AccountEntity } from './account.entity';

export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY';

export interface CreateAccountData {
  ownerId: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  initialBalance?: number;
  isDefault?: boolean;
}

export interface UpdateAccountData {
  name?: string;
}

export interface CreateAccountWithHoldingsData extends CreateAccountData {
  holdings?: { name: string; unitName: string }[];
}

export interface IAccountRepository {
  findAllActiveByOwner(ownerId: string): Promise<AccountEntity[]>;
  findById(id: string): Promise<AccountEntity | null>;
  create(data: CreateAccountWithHoldingsData): Promise<AccountEntity>;
  update(id: string, data: UpdateAccountData): Promise<AccountEntity>;
  softDelete(id: string): Promise<void>;
}
