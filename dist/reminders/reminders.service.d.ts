import { CreateReminderDto, GetRemindersDto, DeleteReminderDto, UpdateReminderDto } from './reminders.dto';
import { Client } from '@libsql/client/.';
export declare class RemindersService {
    private readonly client;
    constructor(client: Client);
    newReminder({ email, title, description, reminderDate }: CreateReminderDto): Promise<{
        id: import("@libsql/client/.").Value;
    }>;
    getReminders({ email }: GetRemindersDto): Promise<import("@libsql/client/.").Row[]>;
    deleteReminder({ email, id }: DeleteReminderDto): Promise<void>;
    updateReminder({ email, id, newTitle, newDescription, newDate }: UpdateReminderDto): Promise<void>;
}
