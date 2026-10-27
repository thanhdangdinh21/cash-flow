import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
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
  ) {}

  @Get('home')
  home(@Request() req: AuthRequest) {
    return this.homeReport.execute(req.user.userId);
  }

  @Get('net-worth')
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
