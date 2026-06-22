import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
} from '../application/dtos/budget.dtos';
import {
  ListBudgetsUseCase,
  CreateBudgetUseCase,
  UpdateBudgetUseCase,
  DeleteBudgetUseCase,
} from '../application/use-cases/budget.use-cases';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(
    private readonly listBudgets: ListBudgetsUseCase,
    private readonly createBudget: CreateBudgetUseCase,
    private readonly updateBudget: UpdateBudgetUseCase,
    private readonly deleteBudget: DeleteBudgetUseCase,
  ) {}

  @Get()
  list(@Request() req: AuthRequest, @Query('month') month?: string) {
    return this.listBudgets.execute(req.user.userId, month);
  }

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateBudgetDto) {
    return this.createBudget.execute(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.updateBudget.execute(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.deleteBudget.execute(req.user.userId, id);
  }
}
