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

    const row = await prisma.transaction.findUniqueOrThrow({ where: { id: txn!.id } });
    expect(row.deletedAt).not.toBeNull();
    const entries = await prisma.journalEntry.findMany({ where: { transactionId: txn!.id } });
    expect(entries.every((e) => e.deletedAt !== null)).toBe(true);

    const cashAfterDelete = await prisma.account.findUniqueOrThrow({ where: { id: cashId } });
    expect(Number(cashAfterDelete.currentBalance)).toBe(0);

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
