export declare class CreateSavingDto {
    email: string;
    endDate: string;
    name: string;
    fullName?: string;
    startDate: string;
    targetAmount: number;
    currentAmount: number;
}
export declare class GetSavingsDto {
    email: string;
}
export declare class DeleteSavingDto {
    email: string;
    id: number;
}
export declare class UpdateSavingDto {
    newCurrentAmount: number;
    newEndDate: string;
    newSavingName: string;
    newTarget: number;
    email: string;
    id: number;
}
