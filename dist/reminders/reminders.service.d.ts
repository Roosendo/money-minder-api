import { Cache } from '@nestjs/cache-manager';
import { CreateReminderDto, GetRemindersDto, DeleteReminderDto, UpdateReminderDto } from './reminders.dto';
import { PrismaService } from '@/prisma.service';
export declare class RemindersService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    newReminder({ email, title, description, reminderDate }: CreateReminderDto): Promise<{
        id: bigint;
    }>;
    getReminders({ email }: GetRemindersDto): Promise<unknown>;
    deleteReminder({ email, id }: DeleteReminderDto): Promise<void>;
    updateReminder({ email, id, newTitle, newDescription, newDate }: UpdateReminderDto): Promise<void>;
}
