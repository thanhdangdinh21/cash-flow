import { Module } from '@nestjs/common';
import {
  ListBudgetsUseCase,
  CreateBudgetUseCase,
  UpdateBudgetUseCase,
  DeleteBudgetUseCase,
} from './application/use-cases/budget.use-cases';
import { BudgetsController } from './presentation/budgets.controller';

@Module({
  providers: [
    ListBudgetsUseCase,
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase,
  ],
  controllers: [BudgetsController],
})
export class BudgetsModule {}
