import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TransactionsModule } from '../../src/transactions/transactions.module';
import { ContactsModule } from '../../src/contacts/contacts.module';
import { CreateTransactionUseCase } from '../../src/transactions/application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../src/transactions/application/use-cases/delete-transaction.use-case';
import { ListContactLoansUseCase } from '../../src/contacts/application/use-cases/contact.use-cases';
import { makeTestModule, resetDb, seedUser } from './db';

describe('loan soft delete', () => {
  let prisma: PrismaService;
  let create: CreateTransactionUseCase;
  let del: DeleteTransactionUseCase;
  let listLoans: ListContactLoansUseCase;

  beforeAll(async () => {
    const mod = await makeTestModule({
      imports: [TransactionsModule, ContactsModule],
    });
    prisma = mod.get(PrismaService);
    create = mod.get(CreateTransactionUseCase);
    del = mod.get(DeleteTransactionUseCase);
    listLoans = mod.get(ListContactLoansUseCase);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => prisma.$disconnect());

  // (c) deleting origin (no settlements) hides the loan
  it('deleting origin (no settlements) hides the loan', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const origin = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: '2026-03-01',
      loanDirection: 'LENT',
      contactName: 'Alice',
    } as any);
    const loanId = origin!.loanId!;
    const contactId = (
      await prisma.loan.findUniqueOrThrow({ where: { id: loanId } })
    ).contactId;

    await del.execute(userId, origin!.id);

    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(loan.deletedAt).not.toBeNull();
    expect(await listLoans.execute(userId, contactId)).toHaveLength(0);
  });

  // (a) deleting a settlement restores remainingAmount and flips status back to ACTIVE
  it('deleting a settlement restores remainingAmount and ACTIVE status', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const origin = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: '2026-03-01',
      loanDirection: 'LENT',
      contactName: 'Bob',
    } as any);
    const loanId = origin!.loanId!;
    const settlement = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: '2026-03-05',
      loanId,
    } as any);
    let loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(loan.status).toBe('SETTLED');
    expect(Number(loan.remainingAmount)).toBe(0);

    await del.execute(userId, settlement!.id);
    loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(loan.status).toBe('ACTIVE');
    expect(Number(loan.remainingAmount)).toBe(200);
    expect(loan.deletedAt).toBeNull(); // settlement delete must NOT soft-delete the loan
  });

  // (b) deleting the origin while a settlement exists throws
  it('rejects deleting the origin while a settlement exists', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const origin = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: '2026-03-01',
      loanDirection: 'LENT',
      contactName: 'Carol',
    } as any);
    const loanId = origin!.loanId!;
    await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 50,
      date: '2026-03-05',
      loanId,
    } as any);
    await expect(del.execute(userId, origin!.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // (d) a settlement referencing a soft-deleted loan throws NotFound
  it('rejects settling a soft-deleted loan', async () => {
    const { userId, cashId } = await seedUser(prisma);
    const origin = await create.execute(userId, {
      transactionType: 'LOAN',
      accountId: cashId,
      amount: 200,
      date: '2026-03-01',
      loanDirection: 'LENT',
      contactName: 'Dave',
    } as any);
    const loanId = origin!.loanId!;
    await del.execute(userId, origin!.id); // soft-deletes the loan
    await expect(
      create.execute(userId, {
        transactionType: 'LOAN',
        accountId: cashId,
        amount: 50,
        date: '2026-03-10',
        loanId,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
