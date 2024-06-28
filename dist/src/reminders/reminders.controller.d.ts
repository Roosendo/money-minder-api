import { RemindersService } from './reminders.service';
import { CreateReminderDto, GetRemindersDto, DeleteReminderDto, UpdateReminderDto } from './reminders.dto';
import { UsersService } from '@/users/users.service';
export declare class RemindersController {
    private readonly remindersService;
    private readonly usersService;
    constructor(remindersService: RemindersService, usersService: UsersService);
    newReminder(createReminderDto: CreateReminderDto): Promise<void>;
    getReminders(getRemindersDto: GetRemindersDto): Promise<import("@libsql/client/.").Row[]>;
    deleteReminder(deleteReminderDto: DeleteReminderDto): Promise<void>;
    updateReminder(updateReminderDto: UpdateReminderDto): Promise<void>;
}
