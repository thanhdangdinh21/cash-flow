import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from '../../../users/domain/user.repository.interface';
import type { IUserRepository } from '../../../users/domain/user.repository.interface';
import { SeedDefaultAccountsUseCase } from '../../../accounts/application/use-cases/seed-default-accounts.use-case';
import type { RegisterDto } from '../dtos/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
    private readonly seedAccounts: SeedDefaultAccountsUseCase,
  ) {}

  async execute(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    await this.seedAccounts.execute(user.id);

    return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }) };
  }
}
