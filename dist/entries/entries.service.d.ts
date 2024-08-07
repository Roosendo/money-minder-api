import { Client } from '@libsql/client/.';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto';
interface FS {
    totalEntries: number | null;
}
export declare class EntryService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newEntry({ email, date, amount, category, description }: CreateEntryDto): Promise<void>;
    getEntries({ email }: GetEntriesDto): Promise<unknown>;
    getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto): Promise<unknown>;
    getMonthlySummary({ email, month, year }: MonthlyEntryDto): Promise<import("@libsql/client/.").Row[] | FS[]>;
    getYearlySummary({ email, year }: YearlyEntryDto): Promise<import("@libsql/client/.").Row[] | FS[]>;
}
export {};
