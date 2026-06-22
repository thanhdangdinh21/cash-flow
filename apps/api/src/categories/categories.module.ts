import { Module } from '@nestjs/common';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { SeedDefaultCategoriesUseCase } from './application/use-cases/seed-default-categories.use-case';
import {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  CreateSubCategoryUseCase,
  DeleteSubCategoryUseCase,
} from './application/use-cases/mutate-category.use-cases';
import { CategoriesController } from './presentation/categories.controller';

@Module({
  providers: [
    ListCategoriesUseCase,
    SeedDefaultCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    CreateSubCategoryUseCase,
    DeleteSubCategoryUseCase,
  ],
  controllers: [CategoriesController],
  exports: [SeedDefaultCategoriesUseCase],
})
export class CategoriesModule {}
