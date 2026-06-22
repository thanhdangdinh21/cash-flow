import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SeedDefaultCategoriesUseCase } from './seed-default-categories.use-case';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seedDefaults: SeedDefaultCategoriesUseCase,
  ) {}

  async execute(userId: string) {
    // Lazy backfill: users registered before default categories existed
    const count = await this.prisma.category.count({ where: { userId } });
    if (count === 0) await this.seedDefaults.execute(userId);

    return this.prisma.category.findMany({
      where: { userId, deletedAt: null },
      include: {
        subCategories: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
