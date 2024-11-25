import { CacheStore } from '@nestjs/cache-manager';
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto';
import { PrismaService } from '@/prisma.service';
interface FS {
    _sum: number;
}
export declare class ExitService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: CacheStore);
    newExpense({ email, date, amount, category, description, creditCardId, isCreditPayment }: CreateExpenseDto): Promise<{
        exit_id: bigint;
    }>;
    getExits({ email }: GetExitsDto): Promise<unknown>;
    getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto): Promise<unknown>;
    getMonthlySummary({ email, month, year }: MonthlyExitDto): Promise<FS | import("@prisma/client").Prisma.GetMoney_exitsAggregateType<{
        where: {
            user_email: string;
            date: {
                gte: Date;
                lt: Date;
            };
        };
        _sum: {
            amount: true;
        };
    }>>;
    getYearlySummary({ email, year }: YearlyExitDto): Promise<FS | import("@prisma/client").Prisma.GetMoney_exitsAggregateType<{
        where: {
            user_email: string;
            date: {
                gte: Date;
                lt: Date;
            };
        };
        _sum: {
            amount: true;
        };
    }>>;
}
export {};
