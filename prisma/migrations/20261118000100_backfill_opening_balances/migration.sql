-- Backfill (issue #7): before this release, POST /accounts stored
-- initial_balance but never applied it, so those accounts show 0. For each
-- live, user-visible ASSET/LIABILITY account with initial_balance <> 0 and no
-- OPENING_BALANCE transaction yet (deleted or not — a deleted one means the
-- user removed it on purpose), post the same opening entry the API now posts
-- at creation time:
--   ASSET     X → DEBIT the account,      CREDIT "Opening balances" (EQUITY)
--   LIABILITY X → DEBIT "Opening balances", CREDIT the account
-- dated at the account's created_at, exclude_from_reports = true.
-- The "Opening balances" system account is found or created per
-- (owner, currency), exactly like the API does.
--
-- Idempotent: running it again finds an opening entry for every account and
-- does nothing. It is written as ONE statement (a DO block) so the
-- integration tests can execute this file directly to prove that.
DO $$
DECLARE
  acc        RECORD;
  equity_id  TEXT;
  txn_id     TEXT;
  amt        NUMERIC(18, 4);
  debit_id   TEXT;
  credit_id  TEXT;
BEGIN
  FOR acc IN
    SELECT a.id, a.owner_id, a.type, a.currency_code, a.initial_balance, a.created_at
    FROM "accounts" a
    WHERE a.initial_balance <> 0
      AND a.deleted_at IS NULL
      AND a.is_system = false
      AND a.type IN ('ASSET', 'LIABILITY')
      AND NOT EXISTS (
        SELECT 1 FROM "transactions" t
        WHERE t.transaction_type = 'OPENING_BALANCE'
          AND (t.debit_account_id = a.id OR t.credit_account_id = a.id)
      )
    ORDER BY a.created_at
  LOOP
    SELECT e.id INTO equity_id
    FROM "accounts" e
    WHERE e.owner_id = acc.owner_id
      AND e.is_system = true
      AND e.type = 'EQUITY'
      AND e.currency_code = acc.currency_code
      AND e.deleted_at IS NULL
    ORDER BY e.created_at
    LIMIT 1;

    IF equity_id IS NULL THEN
      equity_id := gen_random_uuid()::text;
      INSERT INTO "accounts" (id, owner_id, name, type, currency_code, is_system, updated_at)
      VALUES (equity_id, acc.owner_id, 'Opening balances', 'EQUITY', acc.currency_code, true, now());
      INSERT INTO "account_users" (id, account_id, user_id, role)
      VALUES (gen_random_uuid()::text, equity_id, acc.owner_id, 'OWNER');
    END IF;

    -- initial_balance is validated >= 0 by the API; a negative legacy value
    -- flips the direction (an overdrawn asset / a liability in credit).
    amt := abs(acc.initial_balance);
    IF (acc.type = 'ASSET') = (acc.initial_balance > 0) THEN
      debit_id := acc.id;      credit_id := equity_id;
    ELSE
      debit_id := equity_id;   credit_id := acc.id;
    END IF;

    txn_id := gen_random_uuid()::text;
    INSERT INTO "transactions"
      (id, user_id, transaction_type, debit_account_id, credit_account_id,
       amount, date, exclude_from_reports, updated_at)
    VALUES
      (txn_id, acc.owner_id, 'OPENING_BALANCE', debit_id, credit_id,
       amt, acc.created_at, true, now());

    INSERT INTO "journal_entries" (id, transaction_id, account_id, type, amount)
    VALUES
      (gen_random_uuid()::text, txn_id, debit_id,  'DEBIT',  amt),
      (gen_random_uuid()::text, txn_id, credit_id, 'CREDIT', amt);

    -- The user's account moves by exactly initial_balance (signed). EQUITY is
    -- credit-normal: it rises when credited (asset opening), falls when
    -- debited (liability opening).
    UPDATE "accounts"
    SET current_balance = current_balance + acc.initial_balance, updated_at = now()
    WHERE id = acc.id;
    UPDATE "accounts"
    SET current_balance = current_balance
          + CASE WHEN credit_id = equity_id THEN amt ELSE -amt END,
        updated_at = now()
    WHERE id = equity_id;

    equity_id := NULL;
  END LOOP;
END $$;
