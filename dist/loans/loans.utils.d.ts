export declare const getLoanDetails: (userEmail: string) => Promise<{
    last_five_payments: {
        id: bigint;
        payment_date: Date;
        payment_amount: number;
    }[];
    total_payments: number;
    payments: {
        id: bigint;
        payment_date: Date;
        payment_amount: number;
    }[];
    id: bigint;
    user_email: string;
    loan_title: string;
    bank_name: string;
    interest_rate: number;
    loan_amount: number;
    loan_start_date: Date;
    loan_end_date: Date | null;
}[]>;
