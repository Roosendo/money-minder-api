import { CacheStore } from '@nestjs/cache-manager';
import { CashFlowDto, CategoriesDto, RecentTransactionsDto } from './specials.dto';
export declare class SpecialsService {
    private cacheManager;
    constructor(cacheManager: CacheStore);
    getCashFlow({ email, year }: CashFlowDto): Promise<unknown>;
    getCategories({ email, year }: CategoriesDto): Promise<unknown>;
    getRecentTransactions({ email, year }: RecentTransactionsDto): Promise<unknown>;
}
