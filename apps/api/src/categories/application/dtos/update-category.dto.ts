import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class UpdateCategoryDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() icon?: string;
  // null = usable with any account type
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEnum(AccountType)
  accountType?: AccountType | null;
}
