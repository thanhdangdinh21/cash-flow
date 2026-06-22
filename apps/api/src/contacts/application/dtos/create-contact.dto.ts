import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString() @IsNotEmpty() name: string;
}
