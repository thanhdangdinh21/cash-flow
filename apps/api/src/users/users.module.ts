import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserRepository } from './infrastructure/user.repository';

@Module({
  providers: [{ provide: USER_REPOSITORY, useClass: UserRepository }],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
