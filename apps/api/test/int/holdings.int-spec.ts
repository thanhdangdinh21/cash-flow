import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AccountsModule } from '../../src/accounts/accounts.module';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { DeleteHoldingUseCase } from '../../src/accounts/application/use-cases/delete-holding.use-case';
import { makeTestModule, resetDb, seedUser } from './db';

describe('holding delete ignores soft-deleted journal entries', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let delTxn: DeleteTransactionUseCase;
  let delHolding: DeleteHoldingUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [AccountsModule, TransactionsModule],
    });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    delTxn = mod.get(DeleteTransactionUseCase);
    delHolding = mod.get(DeleteHoldingUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  it('allows deleting a holding once its transactions are soft-deleted', async () => {
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
      date: '2026-03-15',
      holdingId: gold.id,
      quantity: 5,
    } as any);

    // Guard still protects a holding with an ACTIVE entry
    await expect(
      delHolding.execute(userId, brokerage.id, gold.id),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Soft-delete the transaction → its journal entries become soft-deleted
    await delTxn.execute(userId, txn!.id);

    // Now the holding has no ACTIVE entries → delete should succeed
    await delHolding.execute(userId, brokerage.id, gold.id);
    const after = await prisma.holding.findUniqueOrThrow({
      where: { id: gold.id },
    });
    expect(after.deletedAt).not.toBeNull();
  });
});
