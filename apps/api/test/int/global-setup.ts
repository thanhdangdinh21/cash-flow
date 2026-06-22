import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Repo root is four levels up from apps/api/test/int
const ROOT = resolve(__dirname, '../../../..');

export default function globalSetup() {
  config({ path: resolve(ROOT, '.env.test') });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is required (see .env.test)');
  execSync('pnpm exec prisma migrate deploy', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
