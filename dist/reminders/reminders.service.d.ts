import { Client } from '@libsql/client/.';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateReminderDto, GetRemindersDto, DeleteReminderDto, UpdateReminderDto } from './reminders.dto';
export declare class RemindersService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newReminder({ email, title, description, reminderDate }: CreateReminderDto): Promise<{
        id: import("@libsql/core/api").Value;
    }>;
    getReminders({ email }: GetRemindersDto): Promise<unknown>;
    deleteReminder({ email, id }: DeleteReminderDto): Promise<void>;
    updateReminder({ email, id, newTitle, newDescription, newDate }: UpdateReminderDto): Promise<void>;
}
