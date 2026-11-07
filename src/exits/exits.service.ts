import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AccountsService } from "@/accounts/accounts.service";
import { CategoriesService } from "@/categories/categories.service";
import { getLastDayOfMonth } from "@/common";
import { PrismaService } from "@/prisma.service";
import {
  CreateExitDto,
  GetExitsDto,
  MonthlyExitDto,
  UpdateExitDto,
  YearlyExitDto,
} from "./exits.dto";

@Injectable()
export class ExitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly accountsService: AccountsService,
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

    const name = categoryName || "General Expense";
    const category = await this.categoriesService.findOrCreate(userId, name, "expense");
    return category.id;
  }

  private async resolvePaymentSource(
    userId: string,
    accountId?: string,
    creditCardId?: string,
  ): Promise<{ account_id: string | null; credit_card_id: string | null }> {
    if (accountId && creditCardId) {
      throw new BadRequestException(
        "An exit cannot have both an account and a credit card as payment source",
      );
    }

    if (creditCardId) {
      const card = await this.prisma.credit_cards.findFirst({
        where: { id: creditCardId, user_id: userId },
      });
      if (!card) {
        throw new NotFoundException(`Credit card ${creditCardId} not found`);
      }
      return { account_id: null, credit_card_id: creditCardId };
    }

    if (accountId) {
      const account = await this.prisma.accounts.findFirst({
        where: { id: accountId, user_id: userId },
      });
      if (!account) {
        throw new NotFoundException(`Account ${accountId} not found`);
      }
      return { account_id: accountId, credit_card_id: null };
    }

    // Default to user's default account to satisfy check constraints
    const defaultAccount = await this.accountsService.getOrCreateDefaultAccount(userId);
    return { account_id: defaultAccount.id, credit_card_id: null };
  }

  async newExit(userId: string, dto: CreateExitDto) {
    const categoryId = await this.resolveCategoryId(userId, dto.categoryId, dto.category);
    const { account_id, credit_card_id } = await this.resolvePaymentSource(
      userId,
      dto.accountId,
      dto.creditCardId,
    );

    const exit = await this.prisma.exits.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        account_id,
        credit_card_id,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description || null,
      },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
        credit_cards: { select: { id: true, name: true, last4: true } },
      },
    });

    await this.invalidateCache(userId);
    return exit;
  }

  async getExits(userId: string, dto: GetExitsDto) {
    const { page, pageSize, categoryId, creditCardId, accountId, from, to, sortBy, sortOrder } =
      dto;
    const cacheKey = `exits_${userId}_${page}_${pageSize}_${categoryId || ""}_${creditCardId || ""}_${accountId || ""}_${from || ""}_${to || ""}_${sortBy}_${sortOrder}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const where: any = {
      user_id: userId,
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(creditCardId ? { credit_card_id: creditCardId } : {}),
      ...(accountId ? { account_id: accountId } : {}),
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
      this.prisma.exits.findMany({
        where,
        orderBy: { [orderByField]: sortOrder || "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          categories: { select: { id: true, name: true, type: true } },
          accounts: { select: { id: true, name: true } },
          credit_cards: { select: { id: true, name: true, last4: true } },
        },
      }),
      this.prisma.exits.count({ where }),
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

  async getExitById(userId: string, id: string) {
    const exit = await this.prisma.exits.findFirst({
      where: { id, user_id: userId },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
        credit_cards: { select: { id: true, name: true, last4: true } },
      },
    });

    if (!exit) {
      throw new NotFoundException(`Exit ${id} not found`);
    }

    return exit;
  }

  async updateExit(userId: string, id: string, dto: UpdateExitDto) {
    const existing = await this.prisma.exits.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Exit ${id} not found`);
    }

    let categoryId = existing.category_id;
    if (dto.categoryId || dto.category) {
      categoryId = await this.resolveCategoryId(userId, dto.categoryId, dto.category);
    }

    let account_id = existing.account_id;
    let credit_card_id = existing.credit_card_id;

    if (dto.accountId !== undefined || dto.creditCardId !== undefined) {
      const resolved = await this.resolvePaymentSource(userId, dto.accountId, dto.creditCardId);
      account_id = resolved.account_id;
      credit_card_id = resolved.credit_card_id;
    }

    const updated = await this.prisma.exits.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        account_id,
        credit_card_id,
        ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      },
      include: {
        categories: { select: { id: true, name: true, type: true } },
        accounts: { select: { id: true, name: true } },
        credit_cards: { select: { id: true, name: true, last4: true } },
      },
    });

    await this.invalidateCache(userId);
    return updated;
  }

  async deleteExit(userId: string, id: string) {
    const existing = await this.prisma.exits.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Exit ${id} not found`);
    }

    await this.prisma.exits.delete({ where: { id } });
    await this.invalidateCache(userId);
    return { deleted: true };
  }

  async getMonthlyBreakdown(userId: string, { month, year }: MonthlyExitDto) {
    const cacheKey = `exits_monthly_breakdown_${userId}_${month}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, month - 1, 1);
    const endDate = getLastDayOfMonth(year, month);
    endDate.setHours(23, 59, 59, 999);

    const breakdown = await this.prisma.exits.groupBy({
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

  async getMonthlySummary(userId: string, { month, year }: MonthlyExitDto) {
    const cacheKey = `exits_monthly_summary_${userId}_${month}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, month - 1, 1);
    const endDate = getLastDayOfMonth(year, month);
    endDate.setHours(23, 59, 59, 999);

    const agg = await this.prisma.exits.aggregate({
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

  // Yearly summary for exits requested by the user
  async getYearlySummary(userId: string, { year }: YearlyExitDto) {
    const cacheKey = `exits_yearly_summary_${userId}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const agg = await this.prisma.exits.aggregate({
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
    const keys = [
      `exits_${userId}`,
      `exits_monthly_breakdown_${userId}`,
      `exits_monthly_summary_${userId}`,
      `exits_yearly_summary_${userId}`,
    ];
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }
}
