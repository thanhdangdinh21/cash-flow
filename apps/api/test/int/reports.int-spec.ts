import { PrismaService } from '../../src/prisma/prisma.service';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { ReportsModule } from '../../src/reports/reports.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { SpendingByCategoryUseCase } from '../../src/reports/application/use-cases/spending-report.use-cases';
import { NetWorthReportUseCase } from '../../src/reports/application/use-cases/net-worth-report.use-case';
import { NetWorthService } from '../../src/reports/application/net-worth.service';
import { makeTestModule, resetDb, seedUser } from './db';

describe('reports exclude soft-deleted transactions', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let spending: SpendingByCategoryUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [TransactionsModule, ReportsModule],
    });
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
    await create.execute(userId, {
      transactionType: 'EXPENSE',
      accountId: cashId,
      amount: 30,
      date: today,
    } as any);
    const b = await create.execute(userId, {
      transactionType: 'EXPENSE',
      accountId: cashId,
      amount: 70,
      date: today,
    } as any);

    expect((await spending.execute(userId, {})).total).toBe(100);
    await del.execute(userId, b!.id);
    expect((await spending.execute(userId, {})).total).toBe(30);
  });
});

describe('net-worth summary: in your accounts vs net worth', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let netWorth: NetWorthService;
  let report: NetWorthReportUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [TransactionsModule, ReportsModule],
    });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    netWorth = mod.get(NetWorthService);
    report = mod.get(NetWorthReportUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  const today = () => new Date().toISOString().slice(0, 10);

  async function seedWithIncome(amount: number) {
    const seeded = await seedUser(prisma);
    await create.execute(seeded.userId, {
      transactionType: 'INCOME',
      accountId: seeded.cashId,
      amount,
      date: today(),
    } as any);
    return seeded;
  }

  async function remaining(loanId: string) {
    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    return Number(loan.remainingAmount);
  }

  it('borrowing $20 then lending $30 from $100: in your accounts 120 then 90, net worth stays 100', async () => {
    const { userId, cashId } = await seedWithIncome(100);
    await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 20,
      date: today(),
      loanDirection: 'BORROWED',
      contactName: 'Bob',
    } as any);
    expect(await netWorth.summary(userId)).toMatchObject({
      inYourAccounts: 120,
      youOwe: 20,
      netWorth: 100,
    });

    await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 30,
      date: today(),
      loanDirection: 'LENT',
      contactName: 'Alice',
    } as any);
    expect(await netWorth.summary(userId)).toEqual({
      assets: 90,
      liabilities: 0,
      inYourAccounts: 90,
      owedToYou: 30,
      youOwe: 20,
      netWorth: 100,
    });
  });

  it('a visible liability account lowers both figures', async () => {
    const { userId } = await seedWithIncome(100);
    await prisma.account.create({
      data: {
        ownerId: userId,
        name: 'Card',
        type: 'LIABILITY',
        currencyCode: 'USD',
        currentBalance: 40,
      },
    });
    expect(await netWorth.summary(userId)).toMatchObject({
      liabilities: 40,
      inYourAccounts: 60,
      netWorth: 60,
    });
  });

  it('lending and borrowing leave net worth unchanged and split out the loan balances', async () => {
    const { userId, cashId } = await seedWithIncome(1000);
    expect(await netWorth.summary(userId)).toEqual({
      assets: 1000,
      liabilities: 0,
      inYourAccounts: 1000,
      owedToYou: 0,
      youOwe: 0,
      netWorth: 1000,
    });

    const lent = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: today(),
      loanDirection: 'LENT',
      contactName: 'Alice',
    } as any);
    const borrowed = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 75,
      date: today(),
      loanDirection: 'BORROWED',
      contactName: 'Bob',
    } as any);

    const summary = await netWorth.summary(userId);
    expect(summary).toEqual({
      assets: 875, // 1000 − 200 lent + 75 borrowed
      liabilities: 0,
      inYourAccounts: 875,
      owedToYou: await remaining(lent!.loanId!),
      youOwe: await remaining(borrowed!.loanId!),
      netWorth: 1000,
    });
    expect(summary.owedToYou).toBe(200);
    expect(summary.youOwe).toBe(75);

    // The net-worth report uses the same calculation for `current`
    const { current, series } = await report.execute(userId);
    expect(current).toBe(1000);
    expect(series.at(-1)!.value).toBe(1000);
  });

  it('partial settlements reduce owedToYou / youOwe without moving net worth', async () => {
    const { userId, cashId } = await seedWithIncome(1000);
    const lent = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: today(),
      loanDirection: 'LENT',
      contactName: 'Alice',
    } as any);
    const borrowed = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 75,
      date: today(),
      loanDirection: 'BORROWED',
      contactName: 'Bob',
    } as any);

    // Alice repays 50; we repay Bob 25
    await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 50,
      date: today(),
      loanId: lent!.loanId!,
    } as any);
    await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 25,
      date: today(),
      loanId: borrowed!.loanId!,
    } as any);

    const summary = await netWorth.summary(userId);
    expect(summary.owedToYou).toBe(150);
    expect(summary.youOwe).toBe(50);
    expect(summary.owedToYou).toBe(await remaining(lent!.loanId!));
    expect(summary.youOwe).toBe(await remaining(borrowed!.loanId!));
    expect(summary.assets).toBe(900); // 875 + 50 − 25
    expect(summary.inYourAccounts).toBe(900);
    expect(summary.netWorth).toBe(1000);
    expect((await report.execute(userId)).current).toBe(1000);
  });

  it('ignores soft-deleted accounts and non-balance-sheet accounts', async () => {
    const { userId } = await seedWithIncome(1000);
    await prisma.account.create({
      data: {
        ownerId: userId,
        name: 'Old card',
        type: 'LIABILITY',
        currencyCode: 'USD',
        currentBalance: 300,
        isActive: false,
        deletedAt: new Date(),
      },
    });
    await prisma.account.create({
      data: {
        ownerId: userId,
        name: 'Opening balances',
        type: 'EQUITY',
        currencyCode: 'USD',
        currentBalance: 500,
      },
    });

    expect(await netWorth.summary(userId)).toMatchObject({
      inYourAccounts: 1000,
      netWorth: 1000,
    });
  });
});
