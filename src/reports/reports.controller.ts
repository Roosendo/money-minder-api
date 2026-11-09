import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  AccountBalancesReportDto,
  ExpenseBreakdownDto,
  MonthlyReportDto,
  MonthlySummariesReportDto,
  RangeReportDto,
  YearlyReportDto,
} from "./reports.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("monthly")
  @ApiOperation({ summary: "Monthly income/expense report from the ledger" })
  async monthly(@CurrentUser() user: users, @Query() dto: MonthlyReportDto) {
    return this.reportsService.getMonthlyReport(user.id, dto);
  }

  @Get("yearly")
  @ApiOperation({ summary: "Yearly report with a 12-month series" })
  async yearly(@CurrentUser() user: users, @Query() dto: YearlyReportDto) {
    return this.reportsService.getYearlyReport(user.id, dto);
  }

  @Get("range")
  @ApiOperation({ summary: "Custom date-range report" })
  async range(@CurrentUser() user: users, @Query() dto: RangeReportDto) {
    return this.reportsService.getRangeReport(user.id, dto);
  }

  @Get("expenses-by-category")
  @ApiOperation({ summary: "Expense totals grouped by category" })
  async expensesByCategory(@CurrentUser() user: users, @Query() dto: ExpenseBreakdownDto) {
    return this.reportsService.getExpenseReport(user.id, dto);
  }

  @Get("account-balances")
  @ApiOperation({ summary: "Current or historical account balances" })
  async accountBalances(@CurrentUser() user: users, @Query() dto: AccountBalancesReportDto) {
    return this.reportsService.getAccountBalances(user.id, dto);
  }

  @Get("credit-cards")
  @ApiOperation({ summary: "Credit card debt and available credit" })
  async creditCards(@CurrentUser() user: users) {
    return this.reportsService.getCreditCardReport(user.id);
  }

  @Get("cash-flow")
  @ApiOperation({ summary: "Legacy-shaped monthly cash flow series" })
  async cashFlow(@CurrentUser() user: users, @Query() dto: MonthlySummariesReportDto) {
    return this.reportsService.getCashFlow(user.id, dto);
  }
}
