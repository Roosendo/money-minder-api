import { Client } from '@libsql/client';
import { CacheStore } from '@nestjs/cache-manager';
import { AddPaymentDTO, CreateLoanDto, DeleteLoansDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto';
export declare class LoansService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newLoan({ userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: CreateLoanDto): Promise<void>;
    getLoans({ email }: GetLoansDto): Promise<unknown>;
    editLoan({ loanId, userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: EditLoansDto): Promise<void>;
    deleteLoan({ loanId, userEmail }: DeleteLoansDto): Promise<void>;
    addPayment({ loanId, paymentDate, paymentAmount }: AddPaymentDTO): Promise<void>;
    editPayment({ paymentId, paymentDate, paymentAmount, email }: EditPaymentDto): Promise<void>;
}
