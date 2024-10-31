import { Client } from '@libsql/client/.';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto';
export declare class SavingsService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newSaving({ email, name, targetAmount, currentAmount, startDate, endDate }: CreateSavingDto): Promise<{
        id: import("@libsql/core/api").Value;
    }>;
    getSavings({ email }: GetSavingsDto): Promise<unknown>;
    deleteSaving({ email, id }: DeleteSavingDto): Promise<void>;
    updateSaving({ email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: UpdateSavingDto): Promise<void>;
}
