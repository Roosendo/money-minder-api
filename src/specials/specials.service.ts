import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";

@Injectable()
export class SpecialsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getCashFlow(userId: string, year: number) {
    const cacheKey = `cashFlow_${userId}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [incomes, expenses] = await Promise.all([
      this.prisma.entries.findMany({
        where: { user_id: userId, date: { gte: start, lte: end } },
        select: { amount: true, date: true },
      }),
      this.prisma.exits.findMany({
        where: { user_id: userId, date: { gte: start, lte: end } },
        select: { amount: true, date: true },
      }),
    ]);

    const monthlyMap = new Map<string, { ingresos: number; egresos: number }>();
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, "0");
      monthlyMap.set(monthStr, { ingresos: 0, egresos: 0 });
    }

    incomes.forEach((entry) => {
      const m = (entry.date.getMonth() + 1).toString().padStart(2, "0");
      const current = monthlyMap.get(m)!;
      current.ingresos += Number(entry.amount);
    });

    expenses.forEach((exit) => {
      const m = (exit.date.getMonth() + 1).toString().padStart(2, "0");
      const current = monthlyMap.get(m)!;
      current.egresos += Number(exit.amount);
    });

    const result = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      total_ingresos: data.ingresos,
      total_egresos: data.egresos,
      balance: data.ingresos - data.egresos,
    }));

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getCategories(userId: string, year: number) {
    const cacheKey = `categories_breakdown_${userId}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [incomes, expenses] = await Promise.all([
      this.prisma.entries.groupBy({
        by: ["category_id"],
        where: { user_id: userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.exits.groupBy({
        by: ["category_id"],
        where: { user_id: userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const allCategoryIds = Array.from(
      new Set([...incomes.map((i) => i.category_id), ...expenses.map((e) => e.category_id)]),
    );

    const categories = await this.prisma.categories.findMany({
      where: { id: { in: allCategoryIds } },
      select: { id: true, name: true, type: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const result = {
      incomes: incomes.map((i) => ({
        categoryId: i.category_id,
        categoryName: categoryMap.get(i.category_id) || "Unknown",
        totalAmount: Number(i._sum.amount || 0),
      })),
      expenses: expenses.map((e) => ({
        categoryId: e.category_id,
        categoryName: categoryMap.get(e.category_id) || "Unknown",
        totalAmount: Number(e._sum.amount || 0),
      })),
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getRecentTransactions(userId: string, year: number) {
    const cacheKey = `recent_transactions_${userId}_${year}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [entries, exits] = await Promise.all([
      this.prisma.entries.findMany({
        where: { user_id: userId, date: { gte: start, lte: end } },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          categories: { select: { name: true } },
        },
      }),
      this.prisma.exits.findMany({
        where: { user_id: userId, date: { gte: start, lte: end } },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          categories: { select: { name: true } },
          credit_cards: { select: { name: true, last4: true } },
        },
      }),
    ]);

    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      type: "income" as const,
      amount: Number(entry.amount),
      category: entry.categories?.name || "General",
      date: entry.date.toISOString().split("T")[0],
      description: entry.description,
    }));

    const formattedExits = exits.map((exit) => ({
      id: exit.id,
      type: "expense" as const,
      amount: Number(exit.amount),
      category: exit.categories?.name || "General",
      date: exit.date.toISOString().split("T")[0],
      description: exit.description,
      creditCard: exit.credit_cards
        ? `${exit.credit_cards.name} (${exit.credit_cards.last4 || ""})`
        : null,
    }));

    const combined = [...formattedEntries, ...formattedExits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    await this.cacheManager.set(cacheKey, combined, 60 * 1000);
    return combined;
  }
}
