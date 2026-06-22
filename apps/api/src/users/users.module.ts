import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserRepository } from './infrastructure/user.repository';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    UpdateUserUseCase,
    GetMeUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
