import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) initialBalance?: number;
}
