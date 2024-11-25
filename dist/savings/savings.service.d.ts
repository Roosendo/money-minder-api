import { CacheStore } from '@nestjs/cache-manager';
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto';
import { PrismaService } from '@/prisma.service';
export declare class SavingsService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: CacheStore);
    newSaving({ email, name, targetAmount, currentAmount, startDate, endDate }: CreateSavingDto): Promise<{
        id: number;
    }>;
    getSavings({ email }: GetSavingsDto): Promise<unknown>;
    deleteSaving({ email, id }: DeleteSavingDto): Promise<void>;
    updateSaving({ email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: UpdateSavingDto): Promise<void>;
}
