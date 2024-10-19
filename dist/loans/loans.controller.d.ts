import { LoansService } from './loans.service';
import { UsersService } from '@/users/users.service';
import { CreateLoanDto, DeleteLoansDto, GetLoansDto } from './loans.dto';
export declare class LoansController {
    private readonly loansService;
    private readonly usersService;
    constructor(loansService: LoansService, usersService: UsersService);
    newLoan(createLoanDto: CreateLoanDto): Promise<void>;
    getLoans(getLoansDto: GetLoansDto): Promise<unknown>;
    editLoan(editLoanDto: CreateLoanDto, loanId: string): Promise<void>;
    deleteLoan(deleteLoanDto: DeleteLoansDto, loanId: string): Promise<void>;
}
