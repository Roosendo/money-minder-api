import { EntryService } from './entries.service';
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto } from './entries.dto';
import { UsersService } from '@/users/users.service';
export declare class EntryController {
    private readonly entryService;
    private readonly usersService;
    constructor(entryService: EntryService, usersService: UsersService);
    newEntry(createEntryDto: CreateEntryDto): Promise<void>;
    getEntries(getEntriesDto: GetEntriesDto): Promise<unknown>;
    getEntriesByCategoryMonthly(monthlyEntryDto: MonthlyEntryDto): Promise<unknown>;
}
