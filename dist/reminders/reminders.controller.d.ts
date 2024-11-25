import { RemindersService } from './reminders.service';
import { CreateReminderDto, GetRemindersDto, DeleteReminderDto, UpdateReminderDto } from './reminders.dto';
import { UsersService } from '@/users/users.service';
export declare class RemindersController {
    private readonly remindersService;
    private readonly usersService;
    constructor(remindersService: RemindersService, usersService: UsersService);
    newReminder(createReminderDto: CreateReminderDto): Promise<{
        id: bigint;
    }>;
    getReminders(getRemindersDto: GetRemindersDto): Promise<unknown>;
    deleteReminder(deleteReminderDto: DeleteReminderDto): Promise<void>;
    updateReminder(updateReminderDto: UpdateReminderDto): Promise<void>;
}
