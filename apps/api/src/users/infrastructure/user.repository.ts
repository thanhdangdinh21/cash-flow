import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateUserData,
  IUserRepository,
} from '../domain/user.repository.interface';
import type { UserEntity } from '../domain/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({ data });
  }

  update(
    id: string,
    data: Partial<Pick<UserEntity, 'language'>>,
  ): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
