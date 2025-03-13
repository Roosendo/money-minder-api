import { Cache } from '@nestjs/cache-manager';
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto';
import { PrismaService } from '@/prisma.service';
interface FS {
    _sum: {
        amount: number;
    };
}
export declare class ExitService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    newExpense({ email, date, amount, category, description, creditCardId, isCreditPayment }: CreateExpenseDto): Promise<{
        exit_id: bigint;
    }>;
    getExits({ email }: GetExitsDto): Promise<unknown>;
    getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto): Promise<unknown>;
    getMonthlySummary({ email, month, year }: MonthlyExitDto): Promise<FS>;
    getYearlySummary({ email, year }: YearlyExitDto): Promise<FS>;
}
export {};
