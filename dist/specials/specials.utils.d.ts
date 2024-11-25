export declare const getMonthlyBalance: (year: string, userEmail: string) => Promise<{
    month: any;
    total_ingresos: any;
    total_egresos: any;
}[]>;
export declare const getCategoryTotalsDetailed: (year: string, userEmail: string) => Promise<any[]>;
export declare const getLatestTransactions: (year: string, userEmail: string) => Promise<({
    date: Date;
    amount: number;
    category: string;
} | {
    date: Date;
    amount: import("@prisma/client/runtime/library").Decimal;
    category: string;
})[]>;
