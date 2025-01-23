export declare class CreateReminderDto {
    description?: string;
    email: string;
    fullName?: string;
    reminderDate: string;
    title: string;
}
export declare class GetRemindersDto {
    email: string;
}
export declare class DeleteReminderDto {
    email: string;
    id: string;
}
export declare class UpdateReminderDto {
    email: string;
    id: number;
    newDescription: string;
    newDate: string;
    newTitle: string;
}
