import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
}
