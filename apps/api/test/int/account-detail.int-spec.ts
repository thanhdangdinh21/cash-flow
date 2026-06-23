import { PrismaService } from '../../src/prisma/prisma.service';
import { AccountsModule } from '../../src/accounts/accounts.module';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { GetAccountDetailUseCase } from '../../src/accounts/application/use-cases/get-account-detail.use-case';
import { makeTestModule, resetDb, seedUser } from './db';

describe('account detail excludes soft-deleted journal entries', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let detail: GetAccountDetailUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [AccountsModule, TransactionsModule],
    });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    detail = mod.get(GetAccountDetailUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('drops a soft-deleted expense from monthOut', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { userId, cashId } = await seedUser(prisma);
    const txn = await create.execute(userId, {
      transactionType: 'EXPENSE',
      accountId: cashId,
      amount: 40,
      date: today,
    } as any);

    let d = await detail.execute(userId, cashId);
    expect(d.monthOut).toBe(40);

    await del.execute(userId, txn!.id);
    d = await detail.execute(userId, cashId);
    expect(d.monthOut).toBe(0);
  });

  it('drops soft-deleted holding lots', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { userId, cashId } = await seedUser(prisma);
    const brokerage = await prisma.account.create({
      data: {
        ownerId: userId,
        name: 'Brokerage',
        type: 'ASSET',
        currencyCode: 'USD',
      },
    });
    const gold = await prisma.holding.create({
      data: { accountId: brokerage.id, name: 'Gold', unitName: 'g' },
    });
    const txn = await create.execute(userId, {
      transactionType: 'TRANSFER',
      accountId: cashId,
      counterAccountId: brokerage.id,
      amount: 300,
      date: today,
      holdingId: gold.id,
      quantity: 5,
    } as any);

    let d = await detail.execute(userId, brokerage.id);
    expect(d.lots.length).toBe(1);

    await del.execute(userId, txn!.id);
    d = await detail.execute(userId, brokerage.id);
    expect(d.lots.length).toBe(0);
  });
});
