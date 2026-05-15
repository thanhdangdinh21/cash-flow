import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHoldingDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() unitName: string;
}
