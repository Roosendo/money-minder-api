import { SpecialsService } from './specials.service';
import { EntryService } from '@/entries/entries.service';
import { ExitService } from '@/exits/exits.service';
import { FinancialSummaryMonthlyDto, FinancialSummaryYearlyDto, CashFlowDto, CategoriesDto, RecentTransactionsDto } from './specials.dto';
export declare class SpecialsController {
    private readonly specialsService;
    private readonly entryService;
    private readonly exitService;
    constructor(specialsService: SpecialsService, entryService: EntryService, exitService: ExitService);
    getFinancialSummaryYearly(financialSummaryYearlyDto: FinancialSummaryYearlyDto): Promise<{
        totalEntries: number;
        totalExits: number;
    }>;
    getFinancialSummaryMonthly(financialSummaryMonthlyDto: FinancialSummaryMonthlyDto): Promise<{
        totalEntries: number | {
            amount: number;
        };
        totalExits: number | {
            amount: number;
        };
    }>;
    getCashFlow(cashFlowDto: CashFlowDto): Promise<unknown>;
    getCategories(categoriesDto: CategoriesDto): Promise<unknown>;
    getRecentTransactions(recentTransactionsDto: RecentTransactionsDto): Promise<unknown>;
}
