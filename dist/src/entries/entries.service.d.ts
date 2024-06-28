import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto';
import { Client } from '@libsql/client/.';
export declare class EntryService {
    private readonly client;
    constructor(client: Client);
    newEntry({ email, date, amount, category, description }: CreateEntryDto): Promise<void>;
    getEntries({ email }: GetEntriesDto): Promise<import("@libsql/client/.").Row[]>;
    getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto): Promise<import("@libsql/client/.").Row[]>;
    getMonthlySummary({ email, month, year }: MonthlyEntryDto): Promise<import("@libsql/client/.").Row[]>;
    getYearlySummary({ email, year }: YearlyEntryDto): Promise<import("@libsql/client/.").Row[]>;
}
