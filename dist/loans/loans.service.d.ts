import { Cache } from '@nestjs/cache-manager';
import { AddPaymentDTO, CreateLoanDto, DeleteLoansDto, DeletePaymentDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto';
import { PrismaService } from '@/prisma.service';
export declare class LoansService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: Cache);
    newLoan({ userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: CreateLoanDto): Promise<{
        id: bigint;
    }>;
    getLoans({ email }: GetLoansDto): Promise<unknown>;
    editLoan({ loanId, userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: EditLoansDto): Promise<void>;
    deleteLoan({ loanId, userEmail }: DeleteLoansDto): Promise<void>;
    addPayment({ loanId, paymentDate, paymentAmount }: AddPaymentDTO): Promise<{
        id: bigint;
    }>;
    editPayment({ paymentId, paymentDate, paymentAmount, email }: EditPaymentDto): Promise<void>;
    deletePayment({ paymentId, email }: DeletePaymentDto): Promise<void>;
}
