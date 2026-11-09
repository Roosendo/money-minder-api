import { Injectable } from "@nestjs/common";
import { ReportsService } from "@/reports/reports.service";
import { TransactionsService } from "@/transactions/transactions.service";

/**
 * Legacy dashboard endpoints. They now read from the unified ledger so the
 * numbers match /reports. The old entries/exits tables are not consulted here.
 */
@Injectable()
export class SpecialsService {
  constructor(
    private readonly reports: ReportsService,
    private readonly transactions: TransactionsService,
  ) {}

  async getCashFlow(userId: string, year: number) {
    return this.reports.getCashFlow(userId, {
      year,
      includeTransferFees: true,
      sortOrder: "asc",
    });
  }

  async getCategories(userId: string, year: number) {
    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const [incomes, expenses] = await Promise.all([
      this.reports.getIncomeBreakdown(userId, from, to),
      this.reports.getExpenseBreakdown(userId, from, to, true),
    ]);

    return {
      incomes: incomes.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.totalAmount,
      })),
      expenses: expenses.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.totalAmount,
      })),
    };
  }

  async getRecentTransactions(userId: string, year: number) {
    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const result = await this.transactions.list(userId, {
      page: 1,
      pageSize: 15,
      from: from.toISOString(),
      to: to.toISOString(),
      sortOrder: "desc",
      includeReversed: false,
    });

    return result.items
      .filter((transaction) => transaction.type === "income" || transaction.type === "expense")
      .map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category?.name ?? "General",
        date: new Date(transaction.occurredAt).toISOString().split("T")[0],
        description: transaction.description,
        creditCard: transaction.movements.find(
          (movement: any) => movement.account?.type === "credit_card",
        )?.account?.name
          ? `${transaction.movements.find((movement: any) => movement.account?.type === "credit_card")?.account?.name}`
          : null,
      }));
  }
}
