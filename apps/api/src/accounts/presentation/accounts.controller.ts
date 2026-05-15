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
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CreateAccountDto } from '../application/dtos/create-account.dto';
import { UpdateAccountDto } from '../application/dtos/update-account.dto';
import { CreateHoldingDto } from '../application/dtos/create-holding.dto';
import { ListAccountsUseCase } from '../application/use-cases/list-accounts.use-case';
import { CreateAccountUseCase } from '../application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../application/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '../application/use-cases/delete-account.use-case';
import { CreateHoldingUseCase } from '../application/use-cases/create-holding.use-case';
import { DeleteHoldingUseCase } from '../application/use-cases/delete-holding.use-case';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly listAccounts: ListAccountsUseCase,
    private readonly createAccount: CreateAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly createHolding: CreateHoldingUseCase,
    private readonly deleteHolding: DeleteHoldingUseCase,
  ) {}

  @Get()
  list(@Request() req: any) {
    return this.listAccounts.execute(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateAccountDto) {
    return this.createAccount.execute(req.user.userId, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.updateAccount.execute(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.deleteAccount.execute(req.user.userId, id);
  }

  @Post(':id/holdings')
  addHolding(@Request() req: any, @Param('id') accountId: string, @Body() dto: CreateHoldingDto) {
    return this.createHolding.execute(req.user.userId, accountId, dto);
  }

  @Delete(':id/holdings/:holdingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHolding(@Request() req: any, @Param('id') accountId: string, @Param('holdingId') holdingId: string) {
    return this.deleteHolding.execute(req.user.userId, accountId, holdingId);
  }
}
