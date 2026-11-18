import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
import { NetWorthSummaryDto } from '../application/dtos/net-worth-summary.dto';
import { NetWorthService } from '../application/net-worth.service';
import { HomeReportUseCase } from '../application/use-cases/home-report.use-case';
import { NetWorthReportUseCase } from '../application/use-cases/net-worth-report.use-case';
import {
  SpendingByCategoryUseCase,
  CategoryTrendUseCase,
} from '../application/use-cases/spending-report.use-cases';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly homeReport: HomeReportUseCase,
    private readonly netWorthReport: NetWorthReportUseCase,
    private readonly spendingByCategory: SpendingByCategoryUseCase,
    private readonly categoryTrend: CategoryTrendUseCase,
    private readonly netWorthService: NetWorthService,
  ) {}

  @Get('home')
  home(@Request() req: AuthRequest) {
    return this.homeReport.execute(req.user.userId);
  }

  @Get('net-worth-summary')
  @ApiOperation({
    summary: 'Current net worth and its parts',
    description:
      'Net worth = all ASSET balances − all LIABILITY balances, including the hidden loan ' +
      'Receivables (owedToYou) and Payables (youOwe) accounts. EQUITY, INCOME and EXPENSE ' +
      'accounts are excluded. Every client screen that shows net worth uses this number; ' +
      'GET /reports/net-worth returns the same value as `current`.',
  })
  @ApiOkResponse({ type: NetWorthSummaryDto })
  netWorthSummary(@Request() req: AuthRequest): Promise<NetWorthSummaryDto> {
    return this.netWorthService.summary(req.user.userId);
  }

  @Get('net-worth')
  @ApiOperation({
    summary: 'Net worth over time',
    description:
      '`current` uses the same rule as GET /reports/net-worth-summary; `series` holds ' +
      'end-of-period values, oldest first.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'year'],
    description: 'Bucket size (default month)',
  })
  netWorth(
    @Request() req: AuthRequest,
    @Query('period') period?: 'month' | 'year',
  ) {
    return this.netWorthReport.execute(req.user.userId, period ?? 'month');
  }

  @Get('spending-by-category')
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Range start, inclusive (ISO 8601; default start of month)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Range end, exclusive (ISO 8601; default start of next month)',
    example: '2026-02-01',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['out', 'in'],
    description: 'out = expenses, in = income (default out)',
  })
  spending(
    @Request() req: AuthRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('direction') direction?: 'out' | 'in',
  ) {
    return this.spendingByCategory.execute(req.user.userId, {
      from,
      to,
      direction,
    });
  }

  @Get('category-trend/:categoryId')
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months, ending with the current one (default 6)',
  })
  trend(
    @Request() req: AuthRequest,
    @Param('categoryId') categoryId: string,
    @Query('months') months?: string,
  ) {
    return this.categoryTrend.execute(
      req.user.userId,
      categoryId,
      months ? parseInt(months, 10) : 6,
    );
  }
}
