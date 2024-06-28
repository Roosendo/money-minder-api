import { CashFlowDto, CategoriesDto, RecentTransactionsDto } from './specials.dto';
import { Client } from '@libsql/client/.';
export declare class SpecialsService {
    private readonly client;
    constructor(client: Client);
    getCashFlow({ email, year }: CashFlowDto): Promise<import("@libsql/client/.").Row[]>;
    getCategories({ email, year }: CategoriesDto): Promise<import("@libsql/client/.").Row[]>;
    getRecentTransactions({ email, year }: RecentTransactionsDto): Promise<import("@libsql/client/.").Row[]>;
}
