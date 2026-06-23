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
