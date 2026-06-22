import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LoanStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthRequest } from '../../auth/auth-request';
import { CreateContactDto } from '../application/dtos/create-contact.dto';
import {
  ListContactsUseCase,
  FindOrCreateContactUseCase,
  ListContactLoansUseCase,
} from '../application/use-cases/contact.use-cases';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(
    private readonly listContacts: ListContactsUseCase,
    private readonly findOrCreateContact: FindOrCreateContactUseCase,
    private readonly listContactLoans: ListContactLoansUseCase,
  ) {}

  @Get()
  list(@Request() req: AuthRequest) {
    return this.listContacts.execute(req.user.userId);
  }

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateContactDto) {
    return this.findOrCreateContact.execute(req.user.userId, dto.name);
  }

  @Get(':id/loans')
  loans(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Query('status') status?: LoanStatus,
  ) {
    return this.listContactLoans.execute(req.user.userId, id, status);
  }
}
