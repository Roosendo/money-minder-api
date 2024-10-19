import { Client } from '@libsql/client/.';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto';
interface FS {
    totalExits: number | null;
}
export declare class ExitService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newExpense({ email, date, amount, category, description, creditCardId, isCreditPayment }: CreateExpenseDto): Promise<void>;
    getExits({ email }: GetExitsDto): Promise<unknown>;
    getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto): Promise<unknown>;
    getMonthlySummary({ email, month, year }: MonthlyExitDto): Promise<import("@libsql/client/.").Row[] | FS[]>;
    getYearlySummary({ email, year }: YearlyExitDto): Promise<import("@libsql/client/.").Row[] | FS[]>;
}
export {};
