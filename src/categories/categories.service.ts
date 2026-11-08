import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { category_type } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getCategories(userId: string, type?: category_type) {
    const cacheKey = `categories_list_${userId}_${type || "all"}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const list = await this.prisma.categories.findMany({
      where: {
        OR: [{ user_id: userId }, { user_id: null }],
        ...(type ? { type } : {}),
      },
      orderBy: { name: "asc" },
    });

    await this.cacheManager.set(cacheKey, list, 60 * 1000);
    return list;
  }

  async createCategory(userId: string, { name, type }: CreateCategoryDto) {
    const created = await this.prisma.categories.create({
      data: {
        user_id: userId,
        name: name.trim(),
        type,
      },
    });

    await this.invalidateCache(userId);
    return created;
  }

  async findOrCreate(userId: string, name: string, type: category_type) {
    const trimmed = name.trim();
    const existing = await this.prisma.categories.findFirst({
      where: {
        name: { equals: trimmed, mode: "insensitive" },
        OR: [{ user_id: userId }, { user_id: null }],
        type,
      },
    });

    if (existing) return existing;

    return this.createCategory(userId, { name: trimmed, type });
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.categories.findFirst({
      where: { id, user_id: userId },
    });

    if (!category) {
      throw new NotFoundException("Category not found or not editable");
    }

    const updated = await this.prisma.categories.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.type ? { type: dto.type } : {}),
      },
    });

    await this.invalidateCache(userId);
    return updated;
  }

  async deleteCategory(userId: string, id: string) {
    const category = await this.prisma.categories.findFirst({
      where: { id, user_id: userId },
    });

    if (!category) {
      throw new NotFoundException("Category not found or cannot be deleted");
    }

    await this.prisma.categories.delete({ where: { id } });
    await this.invalidateCache(userId);
    return { deleted: true };
  }

  private async invalidateCache(userId: string) {
    await this.cacheManager.del(`categories_list_${userId}_all`);
    await this.cacheManager.del(`categories_list_${userId}_income`);
    await this.cacheManager.del(`categories_list_${userId}_expense`);
  }
}
