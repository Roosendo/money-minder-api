import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { getLastDayOfMonth } from "@/common";
import { CategoriesService } from "@/categories/categories.service";
import { PrismaService } from "@/prisma.service";
import {
  CreateEntryDto,
  GetEntriesDto,
  MonthlyEntryDto,
  UpdateEntryDto,
  YearlyEntryDto,
} from "./entries.dto";

@Injectable()
export class EntryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async resolveCategoryId(
    userId: string,
    categoryId?: string,
    categoryName?: string,
  ): Promise<string> {
    if (categoryId) {
      const existing = await this.prisma.categories.findFirst({
        where: { id: categoryId, OR: [{ user_id: userId }, { user_id: null }] },
      });
      if (existing) return existing.id;
    }

    const name = categoryName || "General Income";
    const category = await this.categoriesService.findOrCreate(userId, name, "income");
    return category.id;
  }

  async newEntry(userId: string, dto: CreateEntryDto) {
    const categoryId = await this.resolveCategoryId(userId, dto.categoryId, dto.category);

    const entry = await this.prisma.entries.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        account_id: dto.accountId || null,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description || null,
      },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
      },
    });

    await this.invalidateCache(userId);
    return entry;
  }

  async getEntries(userId: string, dto: GetEntriesDto) {
    const { page, pageSize, categoryId, from, to, sortBy, sortOrder } = dto;
    const cacheKey = `entries_${userId}_${page}_${pageSize}_${categoryId || ""}_${from || ""}_${to || ""}_${sortBy}_${sortOrder}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const where: any = {
      user_id: userId,
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const orderByField = sortBy === "amount" ? "amount" : "date";

    const [items, total] = await this.prisma.$transaction([
      this.prisma.entries.findMany({
        where,
        orderBy: { [orderByField]: sortOrder || "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          categories: { select: { id: true, name: true, type: true } },
          accounts: { select: { id: true, name: true } },
        },
      }),
      this.prisma.entries.count({ where }),
    ]);

    const result = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getEntryById(userId: string, id: string) {
    const entry = await this.prisma.entries.findFirst({
      where: { id, user_id: userId },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Entry ${id} not found`);
    }

    return entry;
  }

  async updateEntry(userId: string, id: string, dto: UpdateEntryDto) {
    const existing = await this.prisma.entries.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Entry ${id} not found`);
    }

    let categoryId = existing.category_id;
    if (dto.categoryId || dto.category) {
      categoryId = await this.resolveCategoryId(userId, dto.categoryId, dto.category);
    }

    const updated = await this.prisma.entries.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(dto.accountId !== undefined ? { account_id: dto.accountId || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
      },
    });

    await this.invalidateCache(userId);
    return updated;
  }

  async deleteEntry(userId: string, id: string) {
    const existing = await this.prisma.entries.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Entry ${id} not found`);
    }

    await this.prisma.entries.delete({ where: { id } });
    await this.invalidateCache(userId);
    return { deleted: true };
  }

  async getMonthlyBreakdown(userId: string, { month, year }: MonthlyEntryDto) {
    const cacheKey = `entries_monthly_breakdown_${userId}_${month}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, month - 1, 1);
    const endDate = getLastDayOfMonth(year, month);
    endDate.setHours(23, 59, 59, 999);

    const breakdown = await this.prisma.entries.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryIds = breakdown.map((b) => b.category_id);
    const categories = await this.prisma.categories.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const result = breakdown.map((b) => ({
      categoryId: b.category_id,
      categoryName: categoryMap.get(b.category_id) || "Unknown",
      totalAmount: Number(b._sum.amount || 0),
      count: b._count.id,
    }));

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getMonthlySummary(userId: string, { month, year }: MonthlyEntryDto) {
    const cacheKey = `entries_monthly_summary_${userId}_${month}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, month - 1, 1);
    const endDate = getLastDayOfMonth(year, month);
    endDate.setHours(23, 59, 59, 999);

    const agg = await this.prisma.entries.aggregate({
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const result = {
      month,
      year,
      totalAmount: Number(agg._sum.amount || 0),
      count: agg._count.id,
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getYearlySummary(userId: string, { year }: YearlyEntryDto) {
    const cacheKey = `entries_yearly_summary_${userId}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const agg = await this.prisma.entries.aggregate({
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const result = {
      year,
      totalAmount: Number(agg._sum.amount || 0),
      count: agg._count.id,
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  private async invalidateCache(userId: string) {
    // Invalidate user cache keys
    const keys = [
      `entries_${userId}`,
      `entries_monthly_breakdown_${userId}`,
      `entries_monthly_summary_${userId}`,
      `entries_yearly_summary_${userId}`,
    ];
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }
}
