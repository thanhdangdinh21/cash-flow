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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
import { CreateTransactionDto } from '../application/dtos/create-transaction.dto';
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../application/use-cases/delete-transaction.use-case';
import {
  GetTransactionUseCase,
  ListTransactionsUseCase,
} from '../application/use-cases/query-transactions.use-cases';

@ApiTags('transactions')
@ApiBearerAuth()
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
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Only transactions debiting or crediting this account',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Only transactions in a sub-category of this category',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Earliest date, inclusive (ISO 8601)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Latest date, inclusive (ISO 8601)',
    example: '2026-01-31',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Page size (default 50, max 100)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '`nextCursor` from the previous page',
  })
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
