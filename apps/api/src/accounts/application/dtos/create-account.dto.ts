import { IsEnum, IsOptional, IsString, IsNumber, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType } from '@prisma/client';

export class CreateHoldingDto {
  @IsString() name: string;
  @IsString() unitName: string;
}

export class CreateAccountDto {
  @IsString() name: string;
  @IsEnum(AccountType) type: AccountType;
  @IsString() currencyCode: string;
  @IsOptional() @IsNumber() @Min(0) initialBalance?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateHoldingDto)
  holdings?: CreateHoldingDto[];
}
