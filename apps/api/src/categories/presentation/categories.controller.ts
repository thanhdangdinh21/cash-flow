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
import type { AuthRequest } from '../../auth/auth-request';
import { CreateCategoryDto } from '../application/dtos/create-category.dto';
import { UpdateCategoryDto } from '../application/dtos/update-category.dto';
import { CreateSubCategoryDto } from '../application/dtos/create-sub-category.dto';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';
import {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  CreateSubCategoryUseCase,
  DeleteSubCategoryUseCase,
} from '../application/use-cases/mutate-category.use-cases';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
    private readonly createSubCategory: CreateSubCategoryUseCase,
    private readonly deleteSubCategory: DeleteSubCategoryUseCase,
  ) {}

  @Get()
  list(@Request() req: AuthRequest) {
    return this.listCategories.execute(req.user.userId);
  }

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateCategoryDto) {
    return this.createCategory.execute(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.updateCategory.execute(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.deleteCategory.execute(req.user.userId, id);
  }

  @Post(':id/sub-categories')
  addSub(
    @Request() req: AuthRequest,
    @Param('id') categoryId: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.createSubCategory.execute(req.user.userId, categoryId, dto);
  }

  @Delete(':id/sub-categories/:subId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSub(
    @Request() req: AuthRequest,
    @Param('id') categoryId: string,
    @Param('subId') subId: string,
  ) {
    return this.deleteSubCategory.execute(req.user.userId, categoryId, subId);
  }
}
