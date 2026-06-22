import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Account, AccountType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FindOrCreateContactUseCase } from '../../../contacts/application/use-cases/contact.use-cases';
import { balanceDelta } from '../balance.helpers';
import type { CreateTransactionDto } from '../dtos/create-transaction.dto';

// System counter-leg accounts, find-or-created per (user, type, currency).
// All flagged is_system so they never appear in lists or pickers.
const SYSTEM_ACCOUNT_NAMES: Partial<Record<AccountType, string>> = {
  ASSET: 'Receivables',
  LIABILITY: 'Payables',
  INCOME: 'General income',
  EXPENSE: 'General expense',
};

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly findOrCreateContact: FindOrCreateContactUseCase,
  ) {}

  async execute(userId: string, dto: CreateTransactionDto) {
    const account = await this.ownedAccount(userId, dto.accountId);

    return this.prisma.$transaction(async (tx) => {
      const { debitAccount, creditAccount, loanId, contactId } =
        await this.resolveLegs(tx, userId, dto, account);

      if (debitAccount.id === creditAccount.id) {
        throw new BadRequestException('Debit and credit accounts must differ');
      }
      if (debitAccount.currencyCode !== creditAccount.currencyCode) {
        throw new BadRequestException(
          'Both accounts must share the same currency',
        );
      }

      const excludeFromReports =
        dto.excludeFromReports ??
        (dto.transactionType === 'TRANSFER' || dto.transactionType === 'LOAN');

      const transaction = await tx.transaction.create({
        data: {
          userId,
          transactionType: dto.transactionType,
          debitAccountId: debitAccount.id,
          creditAccountId: creditAccount.id,
          subCategoryId: dto.subCategoryId ?? null,
          description: dto.description ?? null,
          notes: dto.notes ?? null,
          amount: dto.amount,
          date: new Date(dto.date),
          excludeFromReports,
          loanId,
          contactId,
        },
      });

      const holding = await this.resolveHolding(
        tx,
        dto,
        debitAccount,
        creditAccount,
      );

      for (const leg of [
        { account: debitAccount, type: 'DEBIT' as const },
        { account: creditAccount, type: 'CREDIT' as const },
      ]) {
        const onHoldingAccount = holding?.accountId === leg.account.id;
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: leg.account.id,
            type: leg.type,
            amount: dto.amount,
            holdingId: onHoldingAccount ? holding.id : null,
            quantity: onHoldingAccount ? dto.quantity! : null,
          },
        });
        await tx.account.update({
          where: { id: leg.account.id },
          data: {
            currentBalance: {
              increment: balanceDelta(leg.account.type, leg.type, dto.amount),
            },
          },
        });
        if (onHoldingAccount) {
          // DEBIT on an asset = units in (purchase): cost basis grows by the
          // amount paid. CREDIT = units out (sale/spend): cost basis shrinks
          // by average cost × quantity.
          const isPurchase = leg.type === 'DEBIT';
          const qty = Number(holding.currentQuantity);
          const avg = qty > 0 ? Number(holding.currentCost) / qty : 0;
          const costDelta = isPurchase ? dto.amount : -(avg * dto.quantity!);
          await tx.holding.update({
            where: { id: holding.id },
            data: {
              currentQuantity: {
                increment: isPurchase ? dto.quantity! : -dto.quantity!,
              },
              currentCost: { increment: costDelta },
            },
          });
        }
      }

      return tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          debitAccount: {
            select: { id: true, name: true, type: true, isSystem: true },
          },
          creditAccount: {
            select: { id: true, name: true, type: true, isSystem: true },
          },
          subCategory: { include: { category: true } },
          loan: true,
          contact: { select: { id: true, name: true, balance: true } },
        },
      });
    });
  }

  /** Maps the plain-language dto onto debit/credit accounts (+ loan side effects). */
  private async resolveLegs(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreateTransactionDto,
    account: Account,
  ): Promise<{
    debitAccount: Account;
    creditAccount: Account;
    loanId: string | null;
    contactId: string | null;
  }> {
    switch (dto.transactionType) {
      case 'EXPENSE': {
        const expense = await this.systemAccount(
          tx,
          userId,
          'EXPENSE',
          account.currencyCode,
        );
        return {
          debitAccount: expense,
          creditAccount: account,
          loanId: null,
          contactId: null,
        };
      }
      case 'INCOME': {
        const income = await this.systemAccount(
          tx,
          userId,
          'INCOME',
          account.currencyCode,
        );
        return {
          debitAccount: account,
          creditAccount: income,
          loanId: null,
          contactId: null,
        };
      }
      case 'TRANSFER': {
        if (!dto.counterAccountId) {
          throw new BadRequestException(
            'counterAccountId is required for transfers',
          );
        }
        const to = await this.ownedAccount(userId, dto.counterAccountId);
        return {
          debitAccount: to,
          creditAccount: account,
          loanId: null,
          contactId: null,
        };
      }
      case 'LOAN':
        return this.resolveLoanLegs(tx, userId, dto, account);
    }
  }

  private async resolveLoanLegs(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreateTransactionDto,
    account: Account,
  ) {
    // Settlement of an existing loan
    if (dto.loanId) {
      const loan = await tx.loan.findFirst({
        where: { id: dto.loanId, userId },
      });
      if (!loan) throw new NotFoundException('Loan not found');
      if (loan.status === 'SETTLED')
        throw new BadRequestException('Loan is already settled');
      if (dto.amount > Number(loan.remainingAmount)) {
        throw new BadRequestException(
          'Settlement exceeds the remaining loan balance',
        );
      }

      // Decimal(18,4) column vs JS float — treat sub-cent residue as settled
      const remaining = Number(loan.remainingAmount) - dto.amount;
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          remainingAmount: { decrement: dto.amount },
          ...(remaining < 0.005 && { status: 'SETTLED' as const }),
        },
      });

      if (loan.direction === 'LENT') {
        // Collection: they paid you back — receivable shrinks, they owe less
        const receivables = await this.systemAccount(
          tx,
          userId,
          'ASSET',
          account.currencyCode,
        );
        await tx.contact.update({
          where: { id: loan.contactId },
          data: { balance: { decrement: dto.amount } },
        });
        return {
          debitAccount: account,
          creditAccount: receivables,
          loanId: loan.id,
          contactId: loan.contactId,
        };
      }
      // Repayment: you paid them back — payable shrinks, you owe less
      const payables = await this.systemAccount(
        tx,
        userId,
        'LIABILITY',
        account.currencyCode,
      );
      await tx.contact.update({
        where: { id: loan.contactId },
        data: { balance: { increment: dto.amount } },
      });
      return {
        debitAccount: payables,
        creditAccount: account,
        loanId: loan.id,
        contactId: loan.contactId,
      };
    }

    // New loan
    if (!dto.loanDirection) {
      throw new BadRequestException(
        'loanDirection (or loanId for settlements) is required',
      );
    }
    if (!dto.contactId && !dto.contactName) {
      throw new BadRequestException(
        'contactId or contactName is required for a new loan',
      );
    }
    let contactId = dto.contactId ?? null;
    if (contactId) {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, userId, deletedAt: null },
      });
      if (!contact) throw new NotFoundException('Contact not found');
    } else {
      contactId = (
        await this.findOrCreateContact.execute(userId, dto.contactName!, tx)
      ).id;
    }

    const loan = await tx.loan.create({
      data: {
        userId,
        contactId,
        direction: dto.loanDirection,
        principal: dto.amount,
        remainingAmount: dto.amount,
        interestRate: dto.interestRate ?? null,
        interestPeriod: dto.interestPeriod ?? null,
        date: new Date(dto.date),
      },
    });

    if (dto.loanDirection === 'LENT') {
      const receivables = await this.systemAccount(
        tx,
        userId,
        'ASSET',
        account.currencyCode,
      );
      await tx.contact.update({
        where: { id: contactId },
        data: { balance: { increment: dto.amount } },
      });
      return {
        debitAccount: receivables,
        creditAccount: account,
        loanId: loan.id,
        contactId,
      };
    }
    const payables = await this.systemAccount(
      tx,
      userId,
      'LIABILITY',
      account.currencyCode,
    );
    await tx.contact.update({
      where: { id: contactId },
      data: { balance: { decrement: dto.amount } },
    });
    return {
      debitAccount: account,
      creditAccount: payables,
      loanId: loan.id,
      contactId,
    };
  }

  private async resolveHolding(
    tx: Prisma.TransactionClient,
    dto: CreateTransactionDto,
    debitAccount: Account,
    creditAccount: Account,
  ) {
    if (dto.holdingId) {
      if (!dto.quantity) {
        throw new BadRequestException(
          'quantity is required when holdingId is set',
        );
      }
      const holding = await tx.holding.findFirst({
        where: { id: dto.holdingId, deletedAt: null },
      });
      if (!holding) throw new NotFoundException('Holding not found');
      if (
        holding.accountId !== debitAccount.id &&
        holding.accountId !== creditAccount.id
      ) {
        throw new BadRequestException(
          'Holding does not belong to either account',
        );
      }
      return holding;
    }
    // Commodity rule: a transaction touching an account with holdings must say
    // which holding and how many units
    const commodity = await tx.holding.findFirst({
      where: {
        accountId: { in: [debitAccount.id, creditAccount.id] },
        deletedAt: null,
      },
    });
    if (commodity) {
      throw new BadRequestException(
        'holdingId and quantity are required for commodity accounts',
      );
    }
    return null;
  }

  private async ownedAccount(
    userId: string,
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const account = await db.account.findFirst({
      where: { id, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.ownerId !== userId) throw new ForbiddenException();
    return account;
  }

  private async systemAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    type: AccountType,
    currencyCode: string,
  ): Promise<Account> {
    const existing = await tx.account.findFirst({
      where: {
        ownerId: userId,
        isSystem: true,
        type,
        currencyCode,
        deletedAt: null,
      },
    });
    if (existing) return existing;
    const account = await tx.account.create({
      data: {
        ownerId: userId,
        name: SYSTEM_ACCOUNT_NAMES[type] ?? 'System',
        type,
        currencyCode,
        isSystem: true,
      },
    });
    await tx.accountUser.create({
      data: { accountId: account.id, userId, role: 'OWNER' },
    });
    return account;
  }
}
