import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
import { CreateTransactionDto } from '../application/dtos/create-transaction.dto';
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../application/use-cases/delete-transaction.use-case';
import {
  GetTransactionUseCase,
  ListTransactionsUseCase,
} from '../application/use-cases/query-transactions.use-cases';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly getTransaction: GetTransactionUseCase,
    private readonly deleteTransaction: DeleteTransactionUseCase,
  ) {}

  @Get()
  list(
    @Request() req: AuthRequest,
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.listTransactions.execute(req.user.userId, {
      accountId,
      categoryId,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get(':id')
  get(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.getTransaction.execute(req.user.userId, id);
  }

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateTransactionDto) {
    return this.createTransaction.execute(req.user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.deleteTransaction.execute(req.user.userId, id);
  }
}
