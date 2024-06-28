import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto';
import { Client } from '@libsql/client/.';
export declare class ExitService {
    private readonly client;
    constructor(client: Client);
    newExpense({ email, date, amount, category, description }: CreateExpenseDto): Promise<void>;
    getExits({ email }: GetExitsDto): Promise<import("@libsql/client/.").Row[]>;
    getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto): Promise<import("@libsql/client/.").Row[]>;
    getMonthlySummary({ email, month, year }: MonthlyExitDto): Promise<import("@libsql/client/.").Row[]>;
    getYearlySummary({ email, year }: YearlyExitDto): Promise<import("@libsql/client/.").Row[]>;
}
