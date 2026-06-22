import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Copies the global DefaultCategory master list into a user's own categories.
// Called at signup, and lazily from ListCategoriesUseCase for users created
// before the defaults existed.
@Injectable()
export class SeedDefaultCategoriesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<void> {
    const defaults = await this.prisma.defaultCategory.findMany({
      include: { subCategories: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const d of defaults) {
        await tx.category.create({
          data: {
            userId,
            name: d.name,
            icon: d.icon,
            accountType: d.accountType,
            isDefault: true,
            subCategories: {
              create: d.subCategories.map((s) => ({
                name: s.name,
                isDefault: true,
              })),
            },
          },
        });
      }
    });
  }
}
