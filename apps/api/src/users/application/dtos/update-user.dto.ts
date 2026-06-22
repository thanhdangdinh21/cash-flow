import { IsIn, IsOptional } from 'class-validator';
import type { Locale } from '@repo/shared/i18n';

// Mirrors supportedLocales in @repo/shared/src/i18n.ts. Inlined as a value
// because that package ships raw .ts the compiled API can't require at
// runtime; the Locale type assertion keeps the two lists in sync.
const supportedLocales = ['en', 'vi'] as const satisfies readonly Locale[];

export class UpdateUserDto {
  @IsOptional()
  @IsIn([...supportedLocales])
  language?: string;
}
