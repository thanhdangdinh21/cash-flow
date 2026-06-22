import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsString() @IsNotEmpty() categoryId: string;
  @IsNumber() @IsPositive() monthlyLimit: number;
}

export class UpdateBudgetDto {
  @IsNumber() @IsPositive() monthlyLimit: number;
}
