import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType } from '@prisma/client';
import { CreateHoldingDto } from './create-holding.dto';

export { CreateHoldingDto };

export class CreateAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(AccountType) type: AccountType;
  @IsString() @IsNotEmpty() currencyCode: string;
  // Starting balance, always >= 0 and read by account type: money in an
  // ASSET, amount owed on a LIABILITY (e.g. a credit card). Posted as an
  // OPENING_BALANCE journal entry; ASSET/LIABILITY only.
  @IsOptional() @IsNumber() @Min(0) initialBalance?: number;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHoldingDto)
  holdings?: CreateHoldingDto[];
}
