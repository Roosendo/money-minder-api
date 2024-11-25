import { CacheStore } from '@nestjs/cache-manager';
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto';
import { PrismaService } from '@/prisma.service';
interface FS {
    _sum: number;
}
export declare class EntryService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: CacheStore);
    newEntry({ email, date, amount, category, description }: CreateEntryDto): Promise<{
        entry_id: bigint;
    }>;
    getEntries({ email }: GetEntriesDto): Promise<unknown>;
    getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto): Promise<unknown>;
    getMonthlySummary({ email, month, year }: MonthlyEntryDto): Promise<FS | import("@prisma/client").Prisma.GetMoney_entriesAggregateType<{
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
    getYearlySummary({ email, year }: YearlyEntryDto): Promise<FS | import("@prisma/client").Prisma.GetMoney_entriesAggregateType<{
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
