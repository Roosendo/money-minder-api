export declare class CreateLoanDto {
    fullName: string;
    userEmail: string;
    loanTitle: string;
    bankName: string;
    loanDate: string;
    interestRate: string;
    monthlyPayment: string;
    totalPaid: string;
}
export declare class GetLoansDto {
    email: string;
}
export declare class EditLoansDto {
    loanId?: string;
    userEmail: string;
    loanTitle?: string;
    bankName?: string;
    loanDate?: string;
    interestRate?: string;
    monthlyPayment?: string;
    totalPaid?: string;
}
export declare class DeleteLoansDto {
    loanId?: string;
    userEmail: string;
}
