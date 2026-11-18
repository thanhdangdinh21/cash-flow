-- AlterEnum
-- OPENING_BALANCE: the journal entry posted when an account is created with a
-- starting balance (issue #7). Kept in its own migration because Postgres
-- can't use a new enum value in the same transaction that adds it; the
-- backfill that uses it runs in the next migration.
ALTER TYPE "TransactionType" ADD VALUE 'OPENING_BALANCE';
