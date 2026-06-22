import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { LoanDirection, TransactionType } from '@prisma/client';

// Plain-language transaction input — the use-case maps it to double entry.
//   EXPENSE  → accountId = the asset/liability account money leaves
//   INCOME   → accountId = the asset account money arrives in
//   TRANSFER → accountId = from, counterAccountId = to
//   LOAN     → new loan: loanDirection + contactId|contactName (+ interest)
//              settlement: loanId (direction derived from the loan)
export class CreateTransactionDto {
  @IsEnum(TransactionType) transactionType: TransactionType;
  @IsNumber() @IsPositive() amount: number;
  @IsDateString() date: string;
  @IsString() @IsNotEmpty() accountId: string;

  @IsOptional() @IsString() counterAccountId?: string;
  @IsOptional() @IsString() subCategoryId?: string;

  @IsOptional() @IsEnum(LoanDirection) loanDirection?: LoanDirection;
  @IsOptional() @IsString() loanId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsNumber() interestRate?: number;
  @IsOptional() @IsString() interestPeriod?: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsString() holdingId?: string;
  @IsOptional() @IsNumber() @IsPositive() quantity?: number;

  // Override the server default (true for TRANSFER/LOAN, false otherwise)
  @IsOptional() @IsBoolean() excludeFromReports?: boolean;
}
