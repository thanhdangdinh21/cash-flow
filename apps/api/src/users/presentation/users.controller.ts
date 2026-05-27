import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../application/dtos/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly updateUser: UpdateUserUseCase) {}

  @Patch('me')
  updateMe(@Request() req: { user: { userId: string } }, @Body() dto: UpdateUserDto) {
    return this.updateUser.execute(req.user.userId, dto);
  }
}
