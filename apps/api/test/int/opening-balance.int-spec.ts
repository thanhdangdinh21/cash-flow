import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AccountsModule } from '../../src/accounts/accounts.module';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { ReportsModule } from '../../src/reports/reports.module';
import { CreateAccountUseCase } from '../../src/accounts/application/use-cases/create-account.use-case';
import { GetAccountDetailUseCase } from '../../src/accounts/application/use-cases/get-account-detail.use-case';
import { ListAccountsUseCase } from '../../src/accounts/application/use-cases/list-accounts.use-case';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { ListTransactionsUseCase } from '../../src/transactions/application/use-cases/query-transactions.use-cases';
import { CreateTransactionDto } from '../../src/transactions/application/dtos/create-transaction.dto';
import { NetWorthService } from '../../src/reports/application/net-worth.service';
import { NetWorthReportUseCase } from '../../src/reports/application/use-cases/net-worth-report.use-case';
import { HomeReportUseCase } from '../../src/reports/application/use-cases/home-report.use-case';
import { SpendingByCategoryUseCase } from '../../src/reports/application/use-cases/spending-report.use-cases';
import { makeTestModule, resetDb } from './db';

const BACKFILL_SQL = readFileSync(
  resolve(
    __dirname,
    '../../../../prisma/migrations/20261118000100_backfill_opening_balances/migration.sql',
  ),
  'utf8',
);

describe('opening balances (issue #7)', () => {
  let prisma: PrismaService;
  let createAccount: CreateAccountUseCase;
  let listAccounts: ListAccountsUseCase;
  let detail: GetAccountDetailUseCase;
  let createTxn: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let listTxns: ListTransactionsUseCase;
  let netWorth: NetWorthService;
  let netWorthReport: NetWorthReportUseCase;
  let home: HomeReportUseCase;
  let spending: SpendingByCategoryUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [AccountsModule, TransactionsModule, ReportsModule],
    });
    prisma = mod.get(PrismaService);
    createAccount = mod.get(CreateAccountUseCase);
    listAccounts = mod.get(ListAccountsUseCase);
    detail = mod.get(GetAccountDetailUseCase);
    createTxn = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    listTxns = mod.get(ListTransactionsUseCase);
    netWorth = mod.get(NetWorthService);
    netWorthReport = mod.get(NetWorthReportUseCase);
    home = mod.get(HomeReportUseCase);
    spending = mod.get(SpendingByCategoryUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  async function newUser() {
    const user = await prisma.user.create({
      data: {
        email: `u${Date.now()}${Math.random()}@test.dev`,
        passwordHash: 'x',
        name: 'Test',
      },
    });
    return user.id;
  }

  const balance = async (id: string) =>
    Number(
      (await prisma.account.findUniqueOrThrow({ where: { id } }))
        .currentBalance,
    );

  const openingTxns = (accountId: string) =>
    prisma.transaction.findMany({
      where: {
        transactionType: 'OPENING_BALANCE',
        OR: [{ debitAccountId: accountId }, { creditAccountId: accountId }],
      },
      include: { journalEntries: true },
    });

  const equityAccounts = (userId: string) =>
    prisma.account.findMany({
      where: { ownerId: userId, isSystem: true, type: 'EQUITY' },
    });

  // The schema's double-entry invariant over live journal entries
  async function expectBalancedJournal() {
    const sums = await prisma.journalEntry.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _sum: { amount: true },
    });
    const debit = Number(sums.find((s) => s.type === 'DEBIT')?._sum.amount);
    const credit = Number(sums.find((s) => s.type === 'CREDIT')?._sum.amount);
    expect(debit).toBe(credit);
  }

  it('ASSET: debits the account, credits a hidden "Opening balances" equity account', async () => {
    const userId = await newUser();
    const account = await createAccount.execute(userId, {
      name: 'Checking',
      type: 'ASSET',
      currencyCode: 'USD',
      initialBalance: 1000,
    });

    expect(Number(account.currentBalance)).toBe(1000);

    const [equity] = await equityAccounts(userId);
    expect(equity).toMatchObject({
      name: 'Opening balances',
      isSystem: true,
      currencyCode: 'USD',
    });
    expect(Number(equity.currentBalance)).toBe(1000);

    const [opening, ...rest] = await openingTxns(account.id);
    expect(rest).toHaveLength(0);
    expect(opening).toMatchObject({
      debitAccountId: account.id,
      creditAccountId: equity.id,
      excludeFromReports: true,
      userId,
    });
    expect(Number(opening.amount)).toBe(1000);
    expect(opening.date).toEqual(account.createdAt);
    expect(opening.journalEntries.map((j) => [j.accountId, j.type])).toEqual(
      expect.arrayContaining([
        [account.id, 'DEBIT'],
        [equity.id, 'CREDIT'],
      ]),
    );

    // Visible in the account list and history; the equity account is not
    const visible = await listAccounts.execute(userId);
    expect(visible.map((a) => a.name)).toEqual(['Checking']);
    const history = await listTxns.execute(userId, { accountId: account.id });
    expect(history.items.map((t) => t.transactionType)).toEqual([
      'OPENING_BALANCE',
    ]);

    expect(await netWorth.summary(userId)).toMatchObject({
      assets: 1000,
      inYourAccounts: 1000,
      netWorth: 1000,
    });
    await expectBalancedJournal();
  });

  it('LIABILITY: a credit card opening is money owed and lowers net worth', async () => {
    const userId = await newUser();
    await createAccount.execute(userId, {
      name: 'Checking',
      type: 'ASSET',
      currencyCode: 'USD',
      initialBalance: 1000,
    });
    const card = await createAccount.execute(userId, {
      name: 'Visa',
      type: 'LIABILITY',
      currencyCode: 'USD',
      initialBalance: 300,
    });

    expect(Number(card.currentBalance)).toBe(300);
    const equity = await equityAccounts(userId);
    expect(equity).toHaveLength(1); // reused per (user, currency)
    expect(Number(equity[0].currentBalance)).toBe(700); // +1000 − 300

    const [opening] = await openingTxns(card.id);
    expect(opening).toMatchObject({
      debitAccountId: equity[0].id,
      creditAccountId: card.id,
      excludeFromReports: true,
    });

    expect(await netWorth.summary(userId)).toMatchObject({
      assets: 1000,
      liabilities: 300,
      inYourAccounts: 700,
      netWorth: 700,
    });
    await expectBalancedJournal();
  });

  it('one "Opening balances" account per currency', async () => {
    const userId = await newUser();
    for (const currencyCode of ['USD', 'VND', 'USD']) {
      await createAccount.execute(userId, {
        name: `Wallet ${currencyCode}`,
        type: 'ASSET',
        currencyCode,
        initialBalance: 10,
      });
    }
    const equity = await equityAccounts(userId);
    expect(equity.map((e) => e.currencyCode).sort()).toEqual(['USD', 'VND']);
  });

  it('no initial balance: no opening entry and no equity account', async () => {
    const userId = await newUser();
    const a = await createAccount.execute(userId, {
      name: 'Empty',
      type: 'ASSET',
      currencyCode: 'USD',
    });
    const b = await createAccount.execute(userId, {
      name: 'Zero',
      type: 'ASSET',
      currencyCode: 'USD',
      initialBalance: 0,
    });
    expect(await openingTxns(a.id)).toHaveLength(0);
    expect(await openingTxns(b.id)).toHaveLength(0);
    expect(await equityAccounts(userId)).toHaveLength(0);
  });

  it('rejects an initial balance on account types that have none', async () => {
    const userId = await newUser();
    await expect(
      createAccount.execute(userId, {
        name: 'Side gig',
        type: 'INCOME',
        currencyCode: 'USD',
        initialBalance: 50,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.account.count({ where: { ownerId: userId } })).toBe(0);
  });

  it('POST /transactions cannot create OPENING_BALANCE', async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      transactionType: 'OPENING_BALANCE',
      amount: 5,
      date: '2026-11-18',
      accountId: 'x',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('transactionType');
  });

  it('stays out of income/spending reports and monthly in/out', async () => {
    const userId = await newUser();
    const account = await createAccount.execute(userId, {
      name: 'Checking',
      type: 'ASSET',
      currencyCode: 'USD',
      initialBalance: 1000,
    });
    await createAccount.execute(userId, {
      name: 'Visa',
      type: 'LIABILITY',
      currencyCode: 'USD',
      initialBalance: 200,
    });

    expect((await spending.execute(userId, {})).total).toBe(0);
    expect((await spending.execute(userId, { direction: 'in' })).total).toBe(0);
    const h = await home.execute(userId);
    expect(h).toMatchObject({ monthIncome: 0, monthSpent: 0, net: 0 });
    expect(h.totalAssets).toBe(1000);
    expect(h.recent.map((t) => t.transactionType)).toEqual([
      'OPENING_BALANCE',
      'OPENING_BALANCE',
    ]);
    const d = await detail.execute(userId, account.id);
    expect(d).toMatchObject({ monthIn: 0, monthOut: 0 });
    expect(Number(d.currentBalance)).toBe(1000);

    // Regular activity on top still counts as usual
    await createTxn.execute(userId, {
      transactionType: 'EXPENSE',
      accountId: account.id,
      amount: 40,
      date: new Date().toISOString().slice(0, 10),
    });
    expect((await spending.execute(userId, {})).total).toBe(40);
    expect((await detail.execute(userId, account.id)).monthOut).toBe(40);
    expect(await balance(account.id)).toBe(960);
  });

  it('net-worth history steps up in the month the account was created, not before', async () => {
    const userId = await newUser();
    await createAccount.execute(userId, {
      name: 'Checking',
      type: 'ASSET',
      currencyCode: 'USD',
      initialBalance: 1000,
    });
    const { current, series } = await netWorthReport.execute(userId);
    expect(current).toBe(1000);
    expect(series.at(-1)!.value).toBe(1000);
    expect(series.slice(0, -1).every((p) => p.value === 0)).toBe(true);
  });

  it('deleting the opening entry returns the account to 0', async () => {
    const userId = await newUser();
    const card = await createAccount.execute(userId, {
      name: 'Visa',
      type: 'LIABILITY',
      currencyCode: 'USD',
      initialBalance: 250,
    });
    const [opening] = await openingTxns(card.id);

    await del.execute(userId, opening.id);

    expect(await balance(card.id)).toBe(0);
    const [equity] = await equityAccounts(userId);
    expect(Number(equity.currentBalance)).toBe(0);
    const [after] = await openingTxns(card.id);
    expect(after.deletedAt).not.toBeNull();
    expect(after.journalEntries.every((j) => j.deletedAt !== null)).toBe(true);
    expect(
      (await listTxns.execute(userId, { accountId: card.id })).items,
    ).toHaveLength(0);
    expect((await netWorth.summary(userId)).netWorth).toBe(0);
    await expectBalancedJournal();
  });

  describe('backfill migration', () => {
    const runBackfill = () => prisma.$executeRawUnsafe(BACKFILL_SQL);

    // Pre-#7 rows: initial_balance stored, never applied
    async function legacyAccount(
      userId: string,
      data: {
        name: string;
        type: 'ASSET' | 'LIABILITY' | 'INCOME';
        initialBalance: number;
        currencyCode?: string;
        createdAt?: Date;
        isSystem?: boolean;
        deletedAt?: Date;
      },
    ) {
      return prisma.account.create({
        data: { ownerId: userId, currencyCode: 'USD', ...data },
      });
    }

    it('creates each missing opening entry once and is idempotent', async () => {
      const userId = await newUser();
      const now = new Date();
      const twoMonthsAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 15),
      );
      const savings = await legacyAccount(userId, {
        name: 'Savings',
        type: 'ASSET',
        initialBalance: 1000,
        createdAt: twoMonthsAgo,
      });
      const card = await legacyAccount(userId, {
        name: 'Card',
        type: 'LIABILITY',
        initialBalance: 400,
        createdAt: twoMonthsAgo,
      });
      const vnd = await legacyAccount(userId, {
        name: 'VND cash',
        type: 'ASSET',
        initialBalance: 50000,
        currencyCode: 'VND',
      });
      // Not touched: no balance, non-asset/liability, deleted, system
      const zero = await legacyAccount(userId, {
        name: 'Zero',
        type: 'ASSET',
        initialBalance: 0,
      });
      const income = await legacyAccount(userId, {
        name: 'Gig',
        type: 'INCOME',
        initialBalance: 70,
      });
      const deleted = await legacyAccount(userId, {
        name: 'Old',
        type: 'ASSET',
        initialBalance: 90,
        deletedAt: now,
      });
      // Created after #7: already has its entry
      const modern = await createAccount.execute(userId, {
        name: 'Modern',
        type: 'ASSET',
        currencyCode: 'USD',
        initialBalance: 25,
      });
      // Created after #7, opening deleted on purpose: must not come back
      const removed = await createAccount.execute(userId, {
        name: 'Removed',
        type: 'ASSET',
        currencyCode: 'USD',
        initialBalance: 60,
      });
      await del.execute(userId, (await openingTxns(removed.id))[0].id);

      // Spending on the legacy account before the backfill runs
      await createTxn.execute(userId, {
        transactionType: 'EXPENSE',
        accountId: savings.id,
        amount: 100,
        date: now.toISOString().slice(0, 10),
      });

      await runBackfill();

      const check = async () => {
        expect(await balance(savings.id)).toBe(900); // 1000 opening − 100
        expect(await balance(card.id)).toBe(400);
        expect(await balance(vnd.id)).toBe(50000);
        expect(await balance(modern.id)).toBe(25);
        expect(await balance(removed.id)).toBe(0);
        for (const a of [zero, income, deleted]) {
          expect(await balance(a.id)).toBe(0);
          expect(await openingTxns(a.id)).toHaveLength(0);
        }
        for (const a of [savings, card, vnd, modern, removed]) {
          expect(await openingTxns(a.id)).toHaveLength(1);
        }

        const equity = await equityAccounts(userId);
        expect(equity.map((e) => e.currencyCode).sort()).toEqual([
          'USD',
          'VND',
        ]);
        const usd = equity.find((e) => e.currencyCode === 'USD')!;
        // +1000 savings − 400 card + 25 modern (removed one netted to 0)
        expect(Number(usd.currentBalance)).toBe(625);
        expect(
          await prisma.accountUser.count({
            where: { accountId: { in: equity.map((e) => e.id) } },
          }),
        ).toBe(2);

        const [savingsOpening] = await openingTxns(savings.id);
        expect(savingsOpening).toMatchObject({
          debitAccountId: savings.id,
          creditAccountId: usd.id,
          excludeFromReports: true,
          userId,
        });
        expect(savingsOpening.date).toEqual(twoMonthsAgo);
        const [cardOpening] = await openingTxns(card.id);
        expect(cardOpening).toMatchObject({
          debitAccountId: usd.id,
          creditAccountId: card.id,
        });
        await expectBalancedJournal();
      };

      await check();
      await runBackfill();
      await check();

      // Net worth (USD + VND summed, as the service does) and its history:
      // the backfilled openings land two months back, not earlier
      const { series } = await netWorthReport.execute(userId);
      const expected = 900 - 400 + 50000 + 25;
      expect(series.at(-1)!.value).toBe(expected);
      // End of last month and the month before: only the backfilled
      // savings (+1000) and card (−400) openings existed
      expect(series.at(-2)!.value).toBe(600);
      expect(series.at(-3)!.value).toBe(600);
      // Before they were created: nothing
      expect(series.at(-4)!.value).toBe(0);
    });
  });
});
