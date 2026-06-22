import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/user.repository.interface';
import type { IUserRepository } from '../../domain/user.repository.interface';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const { id, email, name, avatarUrl, language, theme, notificationsOn } =
      user;
    return { id, email, name, avatarUrl, language, theme, notificationsOn };
  }
}
