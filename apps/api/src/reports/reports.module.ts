import { Module } from '@nestjs/common';
import { NetWorthService } from './application/net-worth.service';
import { HomeReportUseCase } from './application/use-cases/home-report.use-case';
import { NetWorthReportUseCase } from './application/use-cases/net-worth-report.use-case';
import {
  SpendingByCategoryUseCase,
  CategoryTrendUseCase,
} from './application/use-cases/spending-report.use-cases';
import { ReportsController } from './presentation/reports.controller';

@Module({
  providers: [
    NetWorthService,
    HomeReportUseCase,
    NetWorthReportUseCase,
    SpendingByCategoryUseCase,
    CategoryTrendUseCase,
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}
