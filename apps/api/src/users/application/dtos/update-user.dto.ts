import { IsIn, IsOptional } from 'class-validator';
import { supportedLocales } from '@repo/shared/i18n';

export class UpdateUserDto {
  @IsOptional()
  @IsIn([...supportedLocales])
  language?: string;
}
