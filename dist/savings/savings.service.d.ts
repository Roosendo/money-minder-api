import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto';
import { Client } from '@libsql/client/.';
export declare class SavingsService {
    private readonly client;
    constructor(client: Client);
    newSaving({ email, name, targetAmount, currentAmount, startDate, endDate }: CreateSavingDto): Promise<{
        id: import("@libsql/client/.").Value;
    }>;
    getSavings({ email }: GetSavingsDto): Promise<import("@libsql/client/.").Row[]>;
    deleteSaving({ email, id }: DeleteSavingDto): Promise<void>;
    updateSaving({ email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: UpdateSavingDto): Promise<void>;
}
