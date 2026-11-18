import { INestApplication, ValidationPipe } from '@nestjs/common';

const DEFAULT_CORS_ORIGINS = ['http://localhost:3000'];

/**
 * `CORS_ORIGINS` is a comma-separated list of web origins allowed to call the
 * API from a browser (e.g. `https://money-flow.vercel.app`). Unset or empty
 * falls back to the local Next.js dev server.
 */
export function parseCorsOrigins(value: string | undefined): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return origins.length > 0 ? origins : DEFAULT_CORS_ORIGINS;
}

/** App-wide settings shared by main.ts and the e2e tests. */
export function configureApp(
  app: INestApplication,
  env: NodeJS.ProcessEnv = process.env,
) {
  app.enableCors({
    origin: parseCorsOrigins(env.CORS_ORIGINS),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}
