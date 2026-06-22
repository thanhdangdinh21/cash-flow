import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../..', '.env.test') });
// dotenv does not override existing process.env, so set it explicitly.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Safety: integration tests TRUNCATE every table. Refuse to run unless we are
// pointed at the dedicated test database.
if (!process.env.DATABASE_URL?.includes('money_flow_test')) {
  throw new Error(
    `Integration tests must target money_flow_test, got: ${process.env.DATABASE_URL}`,
  );
}
