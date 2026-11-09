import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ReportsService } from "@/reports/reports.service";
import type { users } from "@prisma/client";
import {
  CashFlowDto,
  CategoriesDto,
  FinancialSummaryMonthlyDto,
  FinancialSummaryYearlyDto,
  RecentTransactionsDto,
} from "./specials.dto";
import { SpecialsService } from "./specials.service";

@Controller("specials")
export class SpecialsController {
  constructor(
    private readonly specialsService: SpecialsService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get("financial-summary-yearly")
  async getFinancialSummaryYearly(
    @CurrentUser() user: users,
    @Query() dto: FinancialSummaryYearlyDto,
  ) {
    const report = await this.reportsService.getYearlyReport(user.id, {
      year: dto.year,
      includeTransferFees: true,
    });

    return {
      year: dto.year,
      totalEntries: report.summary.income,
      totalExits: report.summary.expensesIncludingTransferFees,
      netBalance: report.summary.net,
    };
  }

  @Get("financial-summary-monthly")
  async getFinancialSummaryMonthly(
    @CurrentUser() user: users,
    @Query() dto: FinancialSummaryMonthlyDto,
  ) {
    const report = await this.reportsService.getMonthlyReport(user.id, {
      month: dto.month,
      year: dto.year,
      includeTransferFees: true,
    });

    return {
      month: dto.month,
      year: dto.year,
      totalEntries: report.summary.income,
      totalExits: report.summary.expensesIncludingTransferFees,
      netBalance: report.summary.net,
    };
  }

  @Get("cash-flow")
  async getCashFlow(@CurrentUser() user: users, @Query() dto: CashFlowDto) {
    return this.specialsService.getCashFlow(user.id, dto.year);
  }

  @Get("yearly-categories")
  async getCategories(@CurrentUser() user: users, @Query() dto: CategoriesDto) {
    return this.specialsService.getCategories(user.id, dto.year);
  }

  @Get("recent-transactions")
  async getRecentTransactions(@CurrentUser() user: users, @Query() dto: RecentTransactionsDto) {
    return this.specialsService.getRecentTransactions(user.id, dto.year);
  }
}
