import { SavingsService } from './savings.service';
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto';
import { UsersService } from '@/users/users.service';
export declare class SavingsController {
    private readonly savingsService;
    private readonly usersService;
    constructor(savingsService: SavingsService, usersService: UsersService);
    newSaving(createSavingDto: CreateSavingDto): Promise<{
        id: import("@libsql/client/.").Value;
    }>;
    getSavings(getSavingsDto: GetSavingsDto): Promise<unknown>;
    deleteSaving(deleteSavingDto: DeleteSavingDto): Promise<void>;
    updateSaving(updateSavingDto: UpdateSavingDto): Promise<void>;
}
