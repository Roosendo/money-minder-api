import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { dec, money, ZERO } from "@/common/money";
import { BalancesService } from "@/ledger/balances.service";
import { computeAvailableCredit } from "@/ledger/ledger-rules";
import {
  AccountBalancesReportDto,
  ExpenseBreakdownDto,
  MonthlyReportDto,
  MonthlySummariesReportDto,
  RangeReportDto,
  YearlyReportDto,
} from "./reports.dto";

interface SummaryRow {
  income: string;
  expenses: string;
  adjustments: string;
  income_count: number;
  expense_count: number;
  adjustment_count: number;
}

interface FeeRow {
  fees: string;
}

interface BreakdownRow {
  category_id: string | null;
  category_name: string | null;
  total: string;
  count: number;
}

interface MonthRow {
  month: string;
  income: string;
  expenses: string;
  fees: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balances: BalancesService,
  ) {}

  /**
   * A transaction is excluded from P&L when a compensating reversal
   * (`reversal_of:<id>`) exists. The original ledger rows stay in place.
   */
  private get reversalExclusion() {
    return Prisma.sql`
      AND NOT EXISTS (
        SELECT 1
        FROM public.transactions r
        WHERE r.user_id = t.user_id
          AND r.type = 'adjustment'
          AND r.description LIKE 'reversal_of:' || t.id::text || '%'
      )
    `;
  }

  async getSummary(userId: string, from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)::numeric(14, 2)::text AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::numeric(14, 2)::text AS expenses,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'adjustment'), 0)::numeric(14, 2)::text AS adjustments,
        COUNT(*) FILTER (WHERE t.type = 'income')::int AS income_count,
        COUNT(*) FILTER (WHERE t.type = 'expense')::int AS expense_count,
        COUNT(*) FILTER (WHERE t.type = 'adjustment')::int AS adjustment_count
      FROM public.transactions t
      WHERE t.user_id = ${userId}::uuid
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
    `);

    const feeRows = await this.prisma.$queryRaw<FeeRow[]>(Prisma.sql`
      SELECT COALESCE(SUM(tr.fee), 0)::numeric(14, 2)::text AS fees
      FROM public.transfers tr
      JOIN public.transactions t
        ON t.id = tr.transaction_id AND t.user_id = tr.user_id
      WHERE tr.user_id = ${userId}::uuid
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
    `);

    const row = rows[0] ?? {
      income: "0",
      expenses: "0",
      adjustments: "0",
      income_count: 0,
      expense_count: 0,
      adjustment_count: 0,
    };
    const income = dec(row.income);
    const expenses = dec(row.expenses);
    const fees = dec(feeRows[0]?.fees ?? "0");
    const net = income.minus(expenses).minus(fees);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      income: money(income),
      expenses: money(expenses),
      transferFees: money(fees),
      expensesIncludingTransferFees: money(expenses.plus(fees)),
      net: money(net),
      adjustments: money(row.adjustments),
      counts: {
        income: row.income_count,
        expenses: row.expense_count,
        adjustments: row.adjustment_count,
      },
    };
  }

  async getExpenseBreakdown(userId: string, from: Date, to: Date, includeTransferFees = false) {
    const rows = await this.prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        t.category_id::text AS category_id,
        c.name AS category_name,
        COALESCE(SUM(t.amount), 0)::numeric(14, 2)::text AS total,
        COUNT(*)::int AS count
      FROM public.transactions t
      LEFT JOIN public.categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId}::uuid
        AND t.type = 'expense'
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
      GROUP BY t.category_id, c.name
      ORDER BY total DESC
    `);

    const items = rows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name ?? "Uncategorized",
      totalAmount: money(row.total),
      count: row.count,
      isTransferFee: false,
    }));

    if (includeTransferFees) {
      const feeRows = await this.prisma.$queryRaw<FeeRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(tr.fee), 0)::numeric(14, 2)::text AS fees
        FROM public.transfers tr
        JOIN public.transactions t
          ON t.id = tr.transaction_id AND t.user_id = tr.user_id
        WHERE tr.user_id = ${userId}::uuid
          AND t.occurred_at >= ${from}::timestamptz
          AND t.occurred_at <= ${to}::timestamptz
          ${this.reversalExclusion}
      `);
      const fees = dec(feeRows[0]?.fees ?? "0");
      if (fees.gt(0)) {
        items.push({
          categoryId: null,
          categoryName: "Transfer fees",
          totalAmount: money(fees),
          count: 1,
          isTransferFee: true,
        });
      }
    }

    return items;
  }

  async getMonthlySeries(userId: string, year: number, _includeTransferFees = false) {
    const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const rows = await this.prisma.$queryRaw<MonthRow[]>(Prisma.sql`
      SELECT
        to_char(date_trunc('month', t.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)::numeric(14, 2)::text AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::numeric(14, 2)::text AS expenses,
        '0'::numeric(14, 2)::text AS fees
      FROM public.transactions t
      WHERE t.user_id = ${userId}::uuid
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    // Fees always reduce the reported net because the source account really
    // loses them. `includeTransferFees` only controls whether they also appear
    // as a pseudo-category in the expense breakdown.
    const feeRows = await this.prisma.$queryRaw<Array<{ month: string; fees: string }>>(Prisma.sql`
      SELECT
        to_char(date_trunc('month', t.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
        COALESCE(SUM(tr.fee), 0)::numeric(14, 2)::text AS fees
      FROM public.transfers tr
      JOIN public.transactions t
        ON t.id = tr.transaction_id AND t.user_id = tr.user_id
      WHERE tr.user_id = ${userId}::uuid
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const rowMap = new Map(rows.map((row) => [row.month, row]));
    const feeMap = new Map(feeRows.map((row) => [row.month, row.fees]));

    return Array.from({ length: 12 }, (_, index) => {
      const month = `${year}-${String(index + 1).padStart(2, "0")}`;
      const row = rowMap.get(month);
      const income = dec(row?.income ?? "0");
      const expenses = dec(row?.expenses ?? "0");
      const fees = dec(feeMap.get(month) ?? "0");

      return {
        month,
        income: money(income),
        expenses: money(expenses),
        transferFees: money(fees),
        net: money(income.minus(expenses).minus(fees)),
      };
    });
  }

  async getMonthlyReport(userId: string, dto: MonthlyReportDto) {
    const from = new Date(Date.UTC(dto.year, dto.month - 1, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(dto.year, dto.month, 0, 23, 59, 59, 999));

    const [summary, expensesByCategory] = await Promise.all([
      this.getSummary(userId, from, to),
      this.getExpenseBreakdown(userId, from, to, dto.includeTransferFees),
    ]);

    return {
      period: { type: "monthly", year: dto.year, month: dto.month, from, to },
      summary,
      expensesByCategory,
    };
  }

  async getYearlyReport(userId: string, dto: YearlyReportDto) {
    const from = new Date(Date.UTC(dto.year, 0, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(dto.year, 11, 31, 23, 59, 59, 999));

    const [summary, monthly, expensesByCategory] = await Promise.all([
      this.getSummary(userId, from, to),
      this.getMonthlySeries(userId, dto.year, dto.includeTransferFees),
      this.getExpenseBreakdown(userId, from, to, dto.includeTransferFees),
    ]);

    return {
      period: { type: "yearly", year: dto.year, from, to },
      summary,
      monthly,
      expensesByCategory,
    };
  }

  async getRangeReport(userId: string, dto: RangeReportDto) {
    const from = new Date(dto.from);
    const to = new Date(dto.to);

    const [summary, expensesByCategory] = await Promise.all([
      this.getSummary(userId, from, to),
      this.getExpenseBreakdown(userId, from, to, dto.includeTransferFees),
    ]);

    return {
      period: { type: "custom", from, to },
      summary,
      expensesByCategory,
    };
  }

  async getExpenseReport(userId: string, dto: ExpenseBreakdownDto) {
    return this.getExpenseBreakdown(
      userId,
      new Date(dto.from),
      new Date(dto.to),
      dto.includeTransferFees,
    );
  }

  async getIncomeBreakdown(userId: string, from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        t.category_id::text AS category_id,
        c.name AS category_name,
        COALESCE(SUM(t.amount), 0)::numeric(14, 2)::text AS total,
        COUNT(*)::int AS count
      FROM public.transactions t
      LEFT JOIN public.categories c ON c.id = t.category_id
      WHERE t.user_id = ${userId}::uuid
        AND t.type = 'income'
        AND t.occurred_at >= ${from}::timestamptz
        AND t.occurred_at <= ${to}::timestamptz
        ${this.reversalExclusion}
      GROUP BY t.category_id, c.name
      ORDER BY total DESC
    `);

    return rows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name ?? "Uncategorized",
      totalAmount: money(row.total),
      count: row.count,
    }));
  }

  async getAccountBalances(userId: string, dto: AccountBalancesReportDto) {
    const balances = await this.balances.getBalances(
      userId,
      dto.asOf ? new Date(dto.asOf) : new Date(),
      dto.includeArchived,
    );

    const totalAssets = balances
      .filter((balance) => balance.type !== "credit_card")
      .reduce((sum, balance) => sum.plus(dec(balance.balance)), ZERO());
    const totalDebt = balances
      .filter((balance) => balance.type === "credit_card")
      .reduce((sum, balance) => sum.plus(dec(balance.balance)), ZERO());

    return {
      asOf: dto.asOf ?? new Date().toISOString(),
      accounts: balances.map((balance) => ({
        id: balance.id,
        name: balance.name,
        type: balance.type,
        openingBalance: money(balance.opening_balance),
        openingBalanceDate: balance.opening_balance_date,
        movementsTotal: money(balance.movements_total),
        balance: money(balance.balance),
        outstandingDebt: balance.type === "credit_card" ? money(balance.balance) : null,
        isActive: balance.is_active,
      })),
      totals: {
        assets: money(totalAssets),
        creditCardDebt: money(totalDebt),
        netWorth: money(totalAssets.minus(totalDebt)),
      },
    };
  }

  async getCreditCardReport(userId: string) {
    const details = await this.prisma.credit_card_details.findMany({
      where: { user_id: userId },
      include: {
        accounts_credit_card_details_account_id_user_idToaccounts: true,
      },
    });
    const balances = await this.balances.getBalances(userId, new Date(), true);
    const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));

    let totalDebt = ZERO();
    let totalLimit = ZERO();
    let totalAvailable = ZERO();

    const activeDetails = details.filter(
      (detail) => detail.accounts_credit_card_details_account_id_user_idToaccounts?.is_active,
    );

    const cards = activeDetails.map((detail) => {
      const account = detail.accounts_credit_card_details_account_id_user_idToaccounts;
      const debt = dec(balanceMap.get(detail.account_id)?.balance ?? "0");
      const available = computeAvailableCredit(detail.credit_limit, debt);

      totalDebt = totalDebt.plus(debt);
      totalLimit = totalLimit.plus(detail.credit_limit);
      totalAvailable = totalAvailable.plus(available);

      return {
        accountId: detail.account_id,
        name: account.name,
        last4: detail.last4,
        creditLimit: money(detail.credit_limit),
        outstandingDebt: money(debt),
        availableCredit: money(available),
        statementDay: detail.statement_day,
        dueDay: detail.due_day,
        paymentAccountId: detail.payment_account_id,
      };
    });

    return {
      cards,
      totals: {
        creditLimit: money(totalLimit),
        outstandingDebt: money(totalDebt),
        availableCredit: money(totalAvailable),
      },
    };
  }

  async getCashFlow(userId: string, dto: MonthlySummariesReportDto) {
    const series = await this.getMonthlySeries(userId, dto.year, dto.includeTransferFees);
    const result = series.map((row) => ({
      month: row.month.slice(5),
      total_ingresos: row.income,
      total_egresos: row.expenses,
      total_fees: row.transferFees,
      balance: row.net,
    }));
    return dto.sortOrder === "desc" ? result.reverse() : result;
  }
}
