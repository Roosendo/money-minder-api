export declare class CreateExpenseDto {
    amount: number;
    category: string;
    date: string;
    description?: string;
    fullName?: string;
    email: string;
}
export declare class GetExitsDto {
    email: string;
}
export declare class MonthlyExitDto {
    email: string;
    month: string;
    year: string;
}
export declare class YearlyExitDto {
    email: string;
    year: string;
}
