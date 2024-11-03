export declare class CreateLoanDto {
    fullName: string;
    userEmail: string;
    loanTitle: string;
    bankName: string;
    interestRate: string;
    loanAmount: number;
    loanStartDate: string;
    loanEndDate: string;
}
export declare class GetLoansDto {
    email: string;
}
export declare class EditLoansDto {
    loanId: string;
    userEmail: string;
    loanTitle: string;
    bankName: string;
    interestRate: number;
    loanAmount: number;
    loanStartDate: string;
    loanEndDate: string;
}
export declare class DeleteLoansDto {
    loanId?: string;
    userEmail: string;
}
export declare class AddPaymentDTO {
    loanId: number;
    paymentDate: string;
    paymentAmount: number;
}
export declare class EditPaymentDto {
    paymentId: number;
    paymentDate: string;
    paymentAmount: number;
    email: string;
}
export interface APIResponse {
    loan_title: string;
    bank_name: string;
    interest_rate: number;
    loan_amount: number;
    loan_start_date: string;
    loan_end_date: string;
    last_five_payments: string;
    total_payments: number;
}
