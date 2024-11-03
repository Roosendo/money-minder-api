import { LoansService } from './loans.service';
import { UsersService } from '@/users/users.service';
import { AddPaymentDTO, CreateLoanDto, DeleteLoansDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto';
export declare class LoansController {
    private readonly loansService;
    private readonly usersService;
    constructor(loansService: LoansService, usersService: UsersService);
    newLoan(createLoanDto: CreateLoanDto): Promise<void>;
    getLoans(getLoansDto: GetLoansDto): Promise<{
        last_five_payments: any;
        loan_title: string;
        bank_name: string;
        interest_rate: number;
        loan_amount: number;
        loan_start_date: string;
        loan_end_date: string;
        total_payments: number;
    }[]>;
    editLoan(editLoanDto: EditLoansDto, loanId: string): Promise<void>;
    deleteLoan(deleteLoanDto: DeleteLoansDto, loanId: string): Promise<void>;
    addPayment(addPaymentDto: AddPaymentDTO): Promise<void>;
    editPayment(editPaymentDto: EditPaymentDto): Promise<void>;
}
