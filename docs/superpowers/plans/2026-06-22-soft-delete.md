# Soft-Delete Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the API's two remaining hard-delete paths (transactions+journal entries+loans, and budgets) to soft delete, and add `deletedAt IS NULL` filters to every read path so deleted rows vanish from the UI while the rows persist for recovery/audit.

**Architecture:** Soft delete = set `deletedAt` instead of physically removing rows. Balance/holding/contact/loan side effects are still reversed at delete time (unchanged); only the final `DELETE` becomes an `UPDATE … SET deleted_at`. Every user-facing read and every live aggregation gains a `deletedAt: null` filter. `Budget`'s DB-level `@@unique([userId, categoryId])` is dropped (a soft-deleted budget would otherwise block re-creating one for that category) and uniqueness-among-active is enforced in the use-case, mirroring the existing `Contact` pattern.

**Tech Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, Jest + ts-jest. Tests are **integration tests against a dedicated test Postgres database**.

---

## Scope

> **Update (2026-06-22):** the **budgets feature has since been removed entirely** from the app. Task 6 (budgets), the `Budget` entries in the schema/migration tasks, and the `spentByCategory` / budget read-filters referenced below are **obsolete — skip them**. The rest of the plan (transactions, journal entries, loans) still applies.

**In scope:** API only — schema migration, the two delete use-cases, all read-path filters, budget uniqueness in code, and an integration test harness.

**Out of scope (do NOT build here):**
- Restore/undo endpoints or UI (YAGNI — `deletedAt` makes it possible later).
- Snapshot tables / `rebuildRange` (separate future work).
- Web/mobile client changes (the API contract is unchanged — deleted rows simply stop appearing).
- The already-correct soft deletes (`Account`, `Category`, `SubCategory`, `Contact`, `Holding`) — only verify they still pass.

## Models already soft-deleting (reference — leave as-is)
`Account`, `Category`, `SubCategory`, `Contact`, `Holding` already have `deletedAt` and their delete use-cases already set it. Use `DeleteHoldingUseCase` / `DeleteCategoryUseCase` as the pattern.

## Models to convert (this plan)
| Model | Today | After |
|-------|-------|-------|
| `Transaction` | hard delete | `deletedAt` |
| `JournalEntry` | hard delete (with txn) | `deletedAt` (with txn) |
| `Loan` | hard delete (origin) | `deletedAt` (origin) |
| `Budget` | hard delete | `deletedAt`, DB unique dropped |

---

## File Structure

**Create:**
- `apps/api/test/jest-int.json` — Jest config for integration tests (`*.int-spec.ts`).
- `apps/api/test/int/global-setup.ts` — points Prisma at the test DB and runs `migrate deploy` once.
- `apps/api/test/int/setup.ts` — per-worker: maps `TEST_DATABASE_URL` → `DATABASE_URL`.
- `apps/api/test/int/db.ts` — `makeTestModule()`, `resetDb()`, and a `seedUser()` factory.
- `apps/api/test/int/transactions.int-spec.ts`
- `apps/api/test/int/reports.int-spec.ts`
- `apps/api/test/int/loans.int-spec.ts`
- `apps/api/test/int/budgets.int-spec.ts`
- `apps/api/test/int/holdings.int-spec.ts`
- `.env.test` (repo root, git-ignored) — `TEST_DATABASE_URL=…`

**Modify:**
- `prisma/schema.prisma` — add `deletedAt` to `Transaction`, `JournalEntry`, `Loan`, `Budget`; drop `Budget` unique, add non-unique index.
- `apps/api/package.json` — `test:int` script.
- `apps/api/src/transactions/application/use-cases/delete-transaction.use-case.ts` — convert to soft delete.
- `apps/api/src/budgets/application/use-cases/budget.use-cases.ts` — soft-delete + uniqueness-in-code + `deletedAt` filters.
- `apps/api/src/transactions/application/use-cases/query-transactions.use-cases.ts` — read filters.
- `apps/api/src/transactions/application/use-cases/create-transaction.use-case.ts` — loan-settlement lookup filter.
- `apps/api/src/reports/application/use-cases/home-report.use-case.ts` — read filters.
- `apps/api/src/reports/application/use-cases/spending-report.use-cases.ts` — read filters.
- `apps/api/src/reports/application/use-cases/net-worth-report.use-case.ts` — read filter.
- `apps/api/src/contacts/application/use-cases/contact.use-cases.ts` — loan list filter.
- `apps/api/src/accounts/application/use-cases/delete-holding.use-case.ts` — journal-entry guard filter.

---

## Task 1: Integration test harness

**Files:**
- Create: `.env.test`, `apps/api/test/jest-int.json`, `apps/api/test/int/global-setup.ts`, `apps/api/test/int/setup.ts`, `apps/api/test/int/db.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Create the test database**

```bash
createdb money_flow_test   # or: psql -c 'CREATE DATABASE money_flow_test;'
```

- [ ] **Step 2: Add `.env.test` at the repo root** (git-ignored already via `.env*`)

```
TEST_DATABASE_URL=postgresql://localhost:5432/money_flow_test
```

- [ ] **Step 3: Add the integration Jest config** — `apps/api/test/jest-int.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "roots": ["<rootDir>/src", "<rootDir>/test"],
  "testRegex": ".int-spec.ts$",
  "testEnvironment": "node",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "globalSetup": "<rootDir>/test/int/global-setup.ts",
  "setupFilesAfterEnv": ["<rootDir>/test/int/setup.ts"],
  "maxWorkers": 1
}
```

- [ ] **Step 4: `apps/api/test/int/global-setup.ts`** — migrate the test DB once before the suite

```ts
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
```

- [ ] **Step 5: `apps/api/test/int/setup.ts`** — each worker uses the test DB

```ts
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../..', '.env.test') });
// dotenv does not override existing process.env, so set it explicitly.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
```

- [ ] **Step 6: `apps/api/test/int/db.ts`** — module factory, reset, and a user/accounts factory

```ts
import { Test } from '@nestjs/testing';
import type { ModuleMetadata } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

export async function makeTestModule(metadata: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PrismaModule,
      ...(metadata.imports ?? []),
    ],
    providers: metadata.providers ?? [],
  }).compile();
  return moduleRef;
}

// Truncate every table except the migration ledger between tests.
export async function resetDb(prisma: PrismaService) {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

// Minimal fixture: a user with a cash ASSET account, used by most tests.
export async function seedUser(prisma: PrismaService, currency = 'USD') {
  const user = await prisma.user.create({
    data: { email: `u${Date.now()}@test.dev`, passwordHash: 'x', name: 'Test' },
  });
  const cash = await prisma.account.create({
    data: { ownerId: user.id, name: 'Cash', type: 'ASSET', currencyCode: currency },
  });
  return { userId: user.id, cashId: cash.id };
}
```

- [ ] **Step 7: Add the `test:int` script to `apps/api/package.json`**

In the `"scripts"` block, after `"test:e2e"`:

```json
"test:int": "jest --config ./test/jest-int.json --runInBand"
```

- [ ] **Step 8: Smoke-test the harness** — add a throwaway `apps/api/test/int/_smoke.int-spec.ts`

```ts
import { PrismaService } from '../../src/prisma/prisma.service';
import { makeTestModule, resetDb, seedUser } from './db';

describe('harness', () => {
  let prisma: PrismaService;
  beforeAll(async () => {
    const mod = await makeTestModule({});
    prisma = mod.get(PrismaService);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('seeds and resets', async () => {
    const { userId } = await seedUser(prisma);
    expect(await prisma.user.count()).toBe(1);
    await resetDb(prisma);
    expect(await prisma.user.count()).toBe(0);
    expect(userId).toBeDefined();
  });
});
```

Run: `pnpm --filter api test:int`
Expected: 1 passing test.

- [ ] **Step 9: Delete the smoke spec and commit the harness**

```bash
rm apps/api/test/int/_smoke.int-spec.ts
git add apps/api/test/jest-int.json apps/api/test/int apps/api/package.json .gitignore
git commit -m "test(api): add integration test harness against a test Postgres"
```

---

## Task 2: Schema — add `deletedAt`, drop Budget unique

> Structural prerequisite: tests in later tasks reference `deletedAt`, so the column must exist and the Prisma client must be regenerated first. There is no behavior to TDD here; verification is migrate + generate + type-check.

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `deletedAt` to `Transaction`** (after `updatedAt`)

```prisma
  updatedAt       DateTime @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at") // soft delete — never hard delete
```

- [ ] **Step 2: Add `deletedAt` to `JournalEntry`** (after `createdAt`)

```prisma
  createdAt     DateTime         @default(now()) @map("created_at")
  // Soft delete is the ONE permitted post-write mutation on this otherwise
  // write-once table — set together with the parent transaction's deletedAt.
  deletedAt     DateTime?        @map("deleted_at")
```

- [ ] **Step 3: Add `deletedAt` to `Loan`** (after `updatedAt`)

```prisma
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")
```

- [ ] **Step 4: `Budget` — add `deletedAt`, drop the unique, add a plain index**

Replace the tail of the `Budget` model:

```prisma
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  // Relations
  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])

  // Was @@unique([userId, categoryId]) — dropped for soft delete (a deleted
  // budget would block re-creating one for the same category). Uniqueness among
  // active rows is enforced in CreateBudgetUseCase. Index kept for lookups.
  @@index([userId, categoryId])
  @@map("budgets")
```

- [ ] **Step 5: Create the migration and regenerate the client**

Run from repo root:
```bash
pnpm exec prisma migrate dev --name soft_delete_transactions_budgets
```
Expected: a new migration under `prisma/migrations/`, applied cleanly; client regenerated.

- [ ] **Step 6: Verify types compile**

Run: `pnpm --filter api check-types`
Expected: PASS — except `budget.findUnique({ where: { userId_categoryId … } })` call sites now fail to compile (the compound unique is gone). Those are fixed in Task 6; if check-types flags them now, that is expected and confirms every call site was found.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add deletedAt to transactions/journal/loans/budgets, drop budget unique"
```

---

## Task 3: Soft-delete transactions (+ journal entries)

**Files:**
- Test: `apps/api/test/int/transactions.int-spec.ts`
- Modify: `apps/api/src/transactions/application/use-cases/delete-transaction.use-case.ts`
- Modify: `apps/api/src/transactions/application/use-cases/query-transactions.use-cases.ts`

- [ ] **Step 1: Write the failing test** — `transactions.int-spec.ts`

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import {
  ListTransactionsUseCase,
  GetTransactionUseCase,
} from '../../src/transactions/application/use-cases/query-transactions.use-cases';
import { makeTestModule, resetDb, seedUser } from './db';

describe('transaction soft delete', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let list: ListTransactionsUseCase;
  let get: GetTransactionUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({ imports: [TransactionsModule] });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    list = mod.get(ListTransactionsUseCase);
    get = mod.get(GetTransactionUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('reverses balances, marks deletedAt, and hides the row', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const txn = await create.execute(userId, {
      transactionType: 'EXPENSE',
      accountId: cashId,
      amount: 50,
      date: '2026-03-15',
    } as any);

    const cashAfterCreate = await prisma.account.findUniqueOrThrow({ where: { id: cashId } });
    expect(Number(cashAfterCreate.currentBalance)).toBe(-50);

    await del.execute(userId, txn!.id);

    // Row persists, marked deleted; its journal entries too
    const row = await prisma.transaction.findUniqueOrThrow({ where: { id: txn!.id } });
    expect(row.deletedAt).not.toBeNull();
    const entries = await prisma.journalEntry.findMany({ where: { transactionId: txn!.id } });
    expect(entries.every((e) => e.deletedAt !== null)).toBe(true);

    // Balance reversed back to 0
    const cashAfterDelete = await prisma.account.findUniqueOrThrow({ where: { id: cashId } });
    expect(Number(cashAfterDelete.currentBalance)).toBe(0);

    // Hidden from reads
    const page = await list.execute(userId, {});
    expect(page.items).toHaveLength(0);
    await expect(get.execute(userId, txn!.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects double delete', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const txn = await create.execute(userId, {
      transactionType: 'EXPENSE', accountId: cashId, amount: 10, date: '2026-03-15',
    } as any);
    await del.execute(userId, txn!.id);
    await expect(del.execute(userId, txn!.id)).rejects.toBeInstanceOf(BadRequestException);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test:int -- transactions`
Expected: FAIL — the transaction is hard-deleted (`findUniqueOrThrow` throws / row gone), and `list` still returns it before the read filter exists.

- [ ] **Step 3: Convert `DeleteTransactionUseCase` to soft delete**

Full replacement of the `execute` body. Key changes: reject already-deleted; include only active entries; loan guard counts only active siblings; replace the three physical deletes with `deletedAt` updates.

```ts
async execute(userId: string, id: string) {
  const txn = await this.prisma.transaction.findUnique({
    where: { id },
    include: {
      journalEntries: { where: { deletedAt: null }, include: { account: true, holding: true } },
      loan: true,
    },
  });
  if (!txn) throw new NotFoundException('Transaction not found');
  if (txn.userId !== userId) throw new ForbiddenException();
  if (txn.deletedAt) throw new BadRequestException('Transaction is already deleted');

  const amount = Number(txn.amount);
  const now = new Date();

  await this.prisma.$transaction(async (tx) => {
    for (const entry of txn.journalEntries) {
      await tx.account.update({
        where: { id: entry.accountId },
        data: {
          currentBalance: {
            decrement: balanceDelta(entry.account.type, entry.type, Number(entry.amount)),
          },
        },
      });
      if (entry.holdingId && entry.quantity) {
        const qty = Number(entry.quantity);
        const wasPurchase = entry.type === 'DEBIT';
        const h = entry.holding!;
        const currentQty = Number(h.currentQuantity);
        const avg = currentQty > 0 ? Number(h.currentCost) / currentQty : 0;
        await tx.holding.update({
          where: { id: entry.holdingId },
          data: {
            currentQuantity: { increment: wasPurchase ? -qty : qty },
            currentCost: { increment: wasPurchase ? -Number(entry.amount) : avg * qty },
          },
        });
      }
    }

    if (txn.loan) {
      const [earliest, txCount] = await Promise.all([
        tx.transaction.findFirst({
          where: { loanId: txn.loan.id, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        }),
        tx.transaction.count({ where: { loanId: txn.loan.id, deletedAt: null } }),
      ]);
      const isOrigin = earliest?.id === txn.id;
      if (isOrigin && txCount > 1) {
        throw new BadRequestException(
          'Delete the settlement transactions before deleting the loan itself',
        );
      }

      const originSign = txn.loan.direction === 'LENT' ? 1 : -1;
      const delta = (isOrigin ? originSign : -originSign) * amount;
      await tx.contact.update({
        where: { id: txn.loan.contactId },
        data: { balance: { decrement: delta } },
      });

      if (isOrigin) {
        await tx.journalEntry.updateMany({ where: { transactionId: id }, data: { deletedAt: now } });
        await tx.transaction.update({ where: { id }, data: { deletedAt: now } });
        await tx.loan.update({ where: { id: txn.loan.id }, data: { deletedAt: now } });
        return;
      }
      await tx.loan.update({
        where: { id: txn.loan.id },
        data: { remainingAmount: { increment: amount }, status: 'ACTIVE' },
      });
    }

    await tx.journalEntry.updateMany({ where: { transactionId: id }, data: { deletedAt: now } });
    await tx.transaction.update({ where: { id }, data: { deletedAt: now } });
  });
}
```

Also update the file's leading comment (lines 10–13) to describe soft delete instead of hard delete.

- [ ] **Step 4: Add the read filters in `query-transactions.use-cases.ts`**

`ListTransactionsUseCase.execute` — add to the top of the `where` object:
```ts
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
```

`GetTransactionUseCase.execute` — change `findUnique` to `findFirst` with the filter:
```ts
    const txn = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter api test:int -- transactions`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/transactions apps/api/test/int/transactions.int-spec.ts
git commit -m "feat(api): soft-delete transactions and hide them from queries"
```

---

## Task 4: Reports exclude soft-deleted transactions

**Files:**
- Test: `apps/api/test/int/reports.int-spec.ts`
- Modify: `home-report.use-case.ts`, `spending-report.use-cases.ts`, `net-worth-report.use-case.ts`, `budgets/.../budget.use-cases.ts` (`spentByCategory`)

- [ ] **Step 1: Write the failing test** — create two expenses, delete one, assert the spending report and home `monthSpent` drop accordingly.

```ts
import { PrismaService } from '../../src/prisma/prisma.service';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { ReportsModule } from '../../src/reports/reports.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { SpendingByCategoryUseCase } from '../../src/reports/application/use-cases/spending-report.use-cases';
import { makeTestModule, resetDb, seedUser } from './db';

describe('reports exclude soft-deleted transactions', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let spending: SpendingByCategoryUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({ imports: [TransactionsModule, ReportsModule] });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    spending = mod.get(SpendingByCategoryUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('drops a deleted expense from the spending total', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { userId, cashId } = await seedUser(prisma);
    await create.execute(userId, { transactionType: 'EXPENSE', accountId: cashId, amount: 30, date: today } as any);
    const b = await create.execute(userId, { transactionType: 'EXPENSE', accountId: cashId, amount: 70, date: today } as any);

    expect((await spending.execute(userId, {})).total).toBe(100);
    await del.execute(userId, b!.id);
    expect((await spending.execute(userId, {})).total).toBe(30);
  });
});
```

- [ ] **Step 2: Run and confirm failure** — `pnpm --filter api test:int -- reports` → FAIL (total stays 100).

- [ ] **Step 3: Add `deletedAt: null` to every report read.** Apply these exact additions:

| File | Query | Add to `where` |
|------|-------|----------------|
| `home-report.use-case.ts` | `monthTxns` (`transaction.findMany`) | `deletedAt: null` |
| `home-report.use-case.ts` | `recent` (`transaction.findMany`) | `deletedAt: null` |
| `home-report.use-case.ts` | `budget.findMany` | `deletedAt: null` |
| `spending-report.use-cases.ts` | `SpendingByCategoryUseCase` `transaction.findMany` | `deletedAt: null` |
| `spending-report.use-cases.ts` | `CategoryTrendUseCase` `transaction.findMany` | `deletedAt: null` |
| `net-worth-report.use-case.ts` | `journalEntry.findMany` | `deletedAt: null` |
| `budget.use-cases.ts` | `spentByCategory` `transaction.findMany` | `deletedAt: null` |

(The `CategoryTrendUseCase` `budget.findUnique` is fixed in Task 6.)

- [ ] **Step 4: Run to verify pass** — `pnpm --filter api test:int -- reports` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/reports apps/api/src/budgets apps/api/test/int/reports.int-spec.ts
git commit -m "feat(api): exclude soft-deleted transactions from reports"
```

---

## Task 5: Soft-delete loans + filter loan reads

**Files:**
- Test: `apps/api/test/int/loans.int-spec.ts`
- Modify: `contacts/.../contact.use-cases.ts` (`ListContactLoansUseCase`), `transactions/.../create-transaction.use-case.ts` (settlement lookup)

> The loan origin/settlement soft-delete logic itself already lands in Task 3's `DeleteTransactionUseCase` rewrite. This task adds the loan-read filters and proves the loan flows end-to-end.

- [ ] **Step 1: Write the failing test** covering: (a) deleting a settlement restores `remainingAmount` and flips status back to `ACTIVE`; (b) deleting the origin while a settlement exists throws; (c) deleting the origin (no settlements) marks `loan.deletedAt` and removes it from `ListContactLoans`; (d) a settlement referencing a soft-deleted loan throws `NotFound`.

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { ContactsModule } from '../../src/contacts/contacts.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { ListContactLoansUseCase } from '../../src/contacts/application/use-cases/contact.use-cases';
import { makeTestModule, resetDb, seedUser } from './db';

describe('loan soft delete', () => {
  let prisma: PrismaService; let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase; let listLoans: ListContactLoansUseCase;
  beforeAll(async () => {
    const mod = await makeTestModule({ imports: [TransactionsModule, ContactsModule] });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    listLoans = mod.get(ListContactLoansUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('deleting origin (no settlements) hides the loan', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const origin = await create.execute(userId, {
      transactionType: 'LOAN', accountId: cashId, amount: 200,
      date: '2026-03-01', loanDirection: 'LENT', contactName: 'Alice',
    } as any);
    const loanId = origin!.loanId!;
    const contactId = (await prisma.loan.findUniqueOrThrow({ where: { id: loanId } })).contactId;

    await del.execute(userId, origin!.id);

    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(loan.deletedAt).not.toBeNull();
    expect(await listLoans.execute(userId, contactId)).toHaveLength(0);
  });
  // ... settlement-restore, origin-with-settlement-throws, settle-deleted-loan-throws
});
```

- [ ] **Step 2: Run and confirm failure** — `ListContactLoans` still returns the deleted loan.

- [ ] **Step 3: Apply the filters**

`ListContactLoansUseCase` — `loan.findMany` where: add `deletedAt: null`.

`create-transaction.use-case.ts` `resolveLoanLegs` settlement lookup:
```ts
      const loan = await tx.loan.findFirst({
        where: { id: dto.loanId, userId, deletedAt: null },
      });
```

- [ ] **Step 4: Run to verify pass** — `pnpm --filter api test:int -- loans` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/contacts apps/api/src/transactions/application/use-cases/create-transaction.use-case.ts apps/api/test/int/loans.int-spec.ts
git commit -m "feat(api): soft-delete loans and hide them from loan reads"
```

---

## Task 6: Soft-delete budgets + uniqueness in code

**Files:**
- Test: `apps/api/test/int/budgets.int-spec.ts`
- Modify: `budgets/application/use-cases/budget.use-cases.ts`, `reports/application/use-cases/spending-report.use-cases.ts` (`CategoryTrendUseCase` budget lookup)

- [ ] **Step 1: Write the failing test**

```ts
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BudgetsModule } from '../../src/budgets/budgets.module';
import {
  CreateBudgetUseCase, DeleteBudgetUseCase, ListBudgetsUseCase,
} from '../../src/budgets/application/use-cases/budget.use-cases';
import { makeTestModule, resetDb, seedUser } from './db';

describe('budget soft delete', () => {
  let prisma: PrismaService; let create: CreateBudgetUseCase;
  let del: DeleteBudgetUseCase; let list: ListBudgetsUseCase;
  beforeAll(async () => {
    const mod = await makeTestModule({ imports: [BudgetsModule] });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateBudgetUseCase);
    del = mod.get(DeleteBudgetUseCase);
    list = mod.get(ListBudgetsUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  async function category(userId: string) {
    return prisma.category.create({ data: { userId, name: 'Food', icon: 'cart' } });
  }

  it('hides deleted budgets and allows re-create for the same category', async () => {
    const { userId } = await seedUser(prisma);
    const cat = await category(userId);
    const b = await create.execute(userId, { categoryId: cat.id, monthlyLimit: 100 } as any);
    await del.execute(userId, b.id);
    expect(await list.execute(userId)).toHaveLength(0);
    // Re-create must succeed now that the old row is soft-deleted
    const again = await create.execute(userId, { categoryId: cat.id, monthlyLimit: 200 } as any);
    expect(again.id).not.toBe(b.id);
  });

  it('rejects a duplicate active budget', async () => {
    const { userId } = await seedUser(prisma);
    const cat = await category(userId);
    await create.execute(userId, { categoryId: cat.id, monthlyLimit: 100 } as any);
    await expect(
      create.execute(userId, { categoryId: cat.id, monthlyLimit: 50 } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
```

- [ ] **Step 2: Run and confirm failure** — `DeleteBudgetUseCase` hard-deletes (re-create would also work, but `ListBudgets` returns deleted rows and the duplicate check uses the now-removed compound unique → compile/runtime failure).

- [ ] **Step 3: Update `budget.use-cases.ts`**

`ListBudgetsUseCase` — `budget.findMany` where: `{ userId, deletedAt: null }`.

`CreateBudgetUseCase` — replace the existing-budget check (compound unique is gone):
```ts
    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId: dto.categoryId, deletedAt: null },
    });
    if (existing)
      throw new ConflictException('A budget for this category already exists');
```

`UpdateBudgetUseCase` — reject a soft-deleted budget:
```ts
    const budget = await this.prisma.budget.findFirst({ where: { id, deletedAt: null } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
```

`DeleteBudgetUseCase` — soft delete:
```ts
  async execute(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, deletedAt: null } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    await this.prisma.budget.update({ where: { id }, data: { deletedAt: new Date() } });
  }
```

- [ ] **Step 4: Fix the last compound-unique call site** in `spending-report.use-cases.ts` `CategoryTrendUseCase`:
```ts
      this.prisma.budget.findFirst({
        where: { userId, categoryId, deletedAt: null },
        select: { id: true, monthlyLimit: true },
      }),
```

- [ ] **Step 5: Run to verify pass** — `pnpm --filter api test:int -- budgets` → PASS, and `pnpm --filter api check-types` now clean.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/budgets apps/api/src/reports/application/use-cases/spending-report.use-cases.ts apps/api/test/int/budgets.int-spec.ts
git commit -m "feat(api): soft-delete budgets and enforce uniqueness among active rows"
```

---

## Task 7: Holding delete no longer blocked by soft-deleted entries

**Files:**
- Test: `apps/api/test/int/holdings.int-spec.ts`
- Modify: `accounts/application/use-cases/delete-holding.use-case.ts`

- [ ] **Step 1: Write the failing test** — create a holding, post a commodity transaction, soft-delete the transaction, then delete the holding (should succeed because the blocking entry is now soft-deleted).

```ts
// ... build module with AccountsModule + TransactionsModule
it('allows deleting a holding once its transactions are soft-deleted', async () => {
  // create ASSET account + holding, create a commodity purchase txn, delete txn,
  // then expect deleteHolding to resolve (no BadRequestException).
});
```

- [ ] **Step 2: Run and confirm failure** — the journal-entry guard counts the soft-deleted entry and throws.

- [ ] **Step 3: Filter the guard** in `delete-holding.use-case.ts`:
```ts
    const hasEntries = await this.prisma.journalEntry.count({
      where: { holdingId, deletedAt: null },
    });
```

- [ ] **Step 4: Run to verify pass** → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/accounts/application/use-cases/delete-holding.use-case.ts apps/api/test/int/holdings.int-spec.ts
git commit -m "fix(api): ignore soft-deleted journal entries when deleting a holding"
```

---

## Task 8: Full verification

- [ ] **Step 1: Type-check and lint the whole API**

Run: `pnpm --filter api check-types && pnpm --filter api lint`
Expected: both PASS, zero compound-unique references remain.

- [ ] **Step 2: Run the full integration suite**

Run: `pnpm --filter api test:int`
Expected: all `*.int-spec.ts` pass.

- [ ] **Step 3: Run the existing unit/e2e tests**

Run: `pnpm --filter api test`
Expected: existing tests still pass.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Start the API (`pnpm --filter api start:dev`), create a transaction, `DELETE /api/transactions/:id`, then confirm `GET /api/transactions` omits it and `GET /api/transactions/:id` returns 404, while the row still exists in `prisma studio` with `deleted_at` set.

- [ ] **Step 5: Update the README** — the Domain Model now says "hard delete"; flip that bullet to soft delete and note the `deletedAt: null` read-filter convention.

```bash
git add README.md && git commit -m "docs: README reflects soft-delete for transactions and budgets"
```

---

## Post-implementation note

Once snapshots are built (separate plan), the snapshot reversal on delete must also key off `deletedAt`, and `rebuildRange` must filter `deletedAt: null` on journal entries — this soft-delete substrate is what makes that rebuild auditable.
