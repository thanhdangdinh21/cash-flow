import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/user.repository.interface';
import type { IUserRepository } from '../../domain/user.repository.interface';
import type { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.users.update(userId, dto);
  }
}
