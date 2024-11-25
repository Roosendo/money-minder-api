import { Controller, Get, Query, UseFilters } from '@nestjs/common'
import { SpecialsService } from './specials.service'
import { EntryService } from '@/entries/entries.service'
import { ExitService } from '@/exits/exits.service'
import {
  FinancialSummaryMonthlyDto,
  FinancialSummaryYearlyDto,
  CashFlowDto,
  CategoriesDto,
  RecentTransactionsDto
} from './specials.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('api/specials')
@UseFilters(AllExceptionsFilter)
export class SpecialsController {
  constructor(
    private readonly specialsService: SpecialsService,
    private readonly entryService: EntryService,
    private readonly exitService: ExitService
  ) {}

  @Get('financial-summary-yearly')
  async getFinancialSummaryYearly(@Query() financialSummaryYearlyDto: FinancialSummaryYearlyDto) {
    const entries = await this.entryService.getYearlySummary(financialSummaryYearlyDto)
    const exits = await this.exitService.getYearlySummary(financialSummaryYearlyDto)

    const totalEntries = entries._sum || 0
    const totalExits = exits._sum || 0

    return { totalEntries, totalExits }
  }

  @Get('financial-summary-monthly')
  async getFinancialSummaryMonthly(
    @Query() financialSummaryMonthlyDto: FinancialSummaryMonthlyDto
  ) {
    const entries = await this.entryService.getMonthlySummary(financialSummaryMonthlyDto)
    const exits = await this.exitService.getMonthlySummary(financialSummaryMonthlyDto)

    const totalEntries = entries._sum || 0
    const totalExits = exits._sum || 0

    return { totalEntries, totalExits }
  }

  @Get('cash-flow')
  async getCashFlow(@Query() cashFlowDto: CashFlowDto) {
    return this.specialsService.getCashFlow(cashFlowDto)
  }

  @Get('yearly-categories')
  async getCategories(@Query() categoriesDto: CategoriesDto) {
    return this.specialsService.getCategories(categoriesDto)
  }

  @Get('recent-transactions')
  async getRecentTransactions(@Query() recentTransactionsDto: RecentTransactionsDto) {
    return this.specialsService.getRecentTransactions(recentTransactionsDto)
  }
}
