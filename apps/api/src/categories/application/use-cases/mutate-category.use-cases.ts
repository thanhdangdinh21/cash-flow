import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateCategoryDto } from '../dtos/create-category.dto';
import type { UpdateCategoryDto } from '../dtos/update-category.dto';
import type { CreateSubCategoryDto } from '../dtos/create-sub-category.dto';

async function ownedCategory(
  prisma: PrismaService,
  userId: string,
  id: string,
) {
  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
  });
  if (!category) throw new NotFoundException('Category not found');
  if (category.userId !== userId) throw new ForbiddenException();
  return category;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon,
        accountType: dto.accountType ?? null,
      },
      include: { subCategories: { where: { deletedAt: null } } },
    });
  }
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string, dto: UpdateCategoryDto) {
    await ownedCategory(this.prisma, userId, id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.accountType !== undefined && { accountType: dto.accountType }),
      },
      include: {
        subCategories: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
    });
  }
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    await ownedCategory(this.prisma, userId, id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.subCategory.updateMany({
        where: { categoryId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.category.update({ where: { id }, data: { deletedAt: now } }),
    ]);
  }
}

@Injectable()
export class CreateSubCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, categoryId: string, dto: CreateSubCategoryDto) {
    await ownedCategory(this.prisma, userId, categoryId);
    return this.prisma.subCategory.create({
      data: { categoryId, name: dto.name },
    });
  }
}

@Injectable()
export class DeleteSubCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, categoryId: string, subId: string) {
    await ownedCategory(this.prisma, userId, categoryId);
    const sub = await this.prisma.subCategory.findFirst({
      where: { id: subId, categoryId, deletedAt: null },
    });
    if (!sub) throw new NotFoundException('Subcategory not found');
    await this.prisma.subCategory.update({
      where: { id: subId },
      data: { deletedAt: new Date() },
    });
  }
}
