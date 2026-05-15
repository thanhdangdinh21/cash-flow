import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/account.repository.interface';
import type { IAccountRepository } from '../../domain/account.repository.interface';
import type { AccountEntity } from '../../domain/account.entity';
import type { UpdateAccountDto } from '../dtos/update-account.dto';

@Injectable()
export class UpdateAccountUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accounts: IAccountRepository) {}

  async execute(userId: string, id: string, dto: UpdateAccountDto): Promise<AccountEntity> {
    const account = await this.accounts.findById(id);
    if (!account) throw new NotFoundException('Account not found');
    if (account.ownerId !== userId) throw new ForbiddenException();
    if (account.deletedAt) throw new BadRequestException('Account is deleted');
    return this.accounts.update(id, dto);
  }
}
