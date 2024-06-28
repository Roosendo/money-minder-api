export declare class CreateEntryDto {
    email: string;
    date: string;
    amount: number;
    category: string;
    description?: string;
    fullName?: string;
}
export declare class GetEntriesDto {
    email: string;
}
export declare class MonthlyEntryDto {
    email: string;
    month: string;
    year: string;
}
export declare class YearlyEntryDto {
    email: string;
    year: string;
}
