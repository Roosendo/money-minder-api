import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { EntryService } from "@/entries/entries.service";
import { ExitService } from "@/exits/exits.service";
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
    private readonly entryService: EntryService,
    private readonly exitService: ExitService,
  ) {}

  @Get("financial-summary-yearly")
  async getFinancialSummaryYearly(
    @CurrentUser() user: users,
    @Query() dto: FinancialSummaryYearlyDto,
  ) {
    const [entries, exits] = await Promise.all([
      this.entryService.getYearlySummary(user.id, dto) as Promise<{ totalAmount: number }>,
      this.exitService.getYearlySummary(user.id, dto) as Promise<{ totalAmount: number }>,
    ]);

    const totalEntries = entries.totalAmount || 0;
    const totalExits = exits.totalAmount || 0;

    return {
      year: dto.year,
      totalEntries,
      totalExits,
      netBalance: totalEntries - totalExits,
    };
  }

  @Get("financial-summary-monthly")
  async getFinancialSummaryMonthly(
    @CurrentUser() user: users,
    @Query() dto: FinancialSummaryMonthlyDto,
  ) {
    const [entries, exits] = await Promise.all([
      this.entryService.getMonthlySummary(user.id, dto) as Promise<{ totalAmount: number }>,
      this.exitService.getMonthlySummary(user.id, dto) as Promise<{ totalAmount: number }>,
    ]);

    const totalEntries = entries.totalAmount || 0;
    const totalExits = exits.totalAmount || 0;

    return {
      month: dto.month,
      year: dto.year,
      totalEntries,
      totalExits,
      netBalance: totalEntries - totalExits,
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
