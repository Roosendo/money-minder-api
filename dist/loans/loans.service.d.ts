import { Client } from '@libsql/client';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateLoanDto, DeleteLoansDto, EditLoansDto, GetLoansDto } from './loans.dto';
export declare class LoansService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newLoan({ userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }: CreateLoanDto): Promise<void>;
    getLoans({ email }: GetLoansDto): Promise<unknown>;
    editLoan({ loanId, userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }: EditLoansDto): Promise<void>;
    deleteLoan({ loanId, userEmail }: DeleteLoansDto): Promise<void>;
}
