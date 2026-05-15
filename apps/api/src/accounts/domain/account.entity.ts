import type { AccountType } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/client';

export interface HoldingEntity {
  id: string;
  accountId: string;
  name: string;
  unitName: string;
  currentQuantity: Decimal;
  currentCost: Decimal;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountEntity {
  id: string;
  ownerId: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  initialBalance: Decimal;
  currentBalance: Decimal;
  isActive: boolean;
  isDefault: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  holdings?: HoldingEntity[];
}
