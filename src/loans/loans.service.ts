import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { AddPaymentDto, CreateLoanDto, EditLoanDto, EditPaymentDto } from "./loans.dto";

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async newLoan(userId: string, dto: CreateLoanDto) {
    const loan = await this.prisma.loans.create({
      data: {
        user_id: userId,
        name: dto.name,
        direction: dto.direction,
        principal: dto.principal,
        interest_rate: dto.interestRate ?? 0,
        start_date: new Date(dto.startDate),
        due_date: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? "active",
      },
    });

    await this.cacheManager.del(`loans_${userId}`);
    return loan;
  }

  async getLoans(userId: string) {
    const cacheKey = `loans_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const loans = await this.prisma.loans.findMany({
      where: { user_id: userId },
      include: {
        loan_payments: {
          orderBy: { paid_at: "desc" },
        },
      },
      orderBy: { start_date: "desc" },
    });

    const result = loans.map((loan) => {
      const totalPaid = loan.loan_payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const principal = Number(loan.principal);
      const remaining = Math.max(0, principal - totalPaid);

      return {
        id: loan.id,
        name: loan.name,
        direction: loan.direction,
        principal,
        interestRate: Number(loan.interest_rate),
        startDate: loan.start_date.toISOString().split("T")[0],
        dueDate: loan.due_date ? loan.due_date.toISOString().split("T")[0] : null,
        status: loan.status,
        totalPaid,
        remaining,
        lastFivePayments: loan.loan_payments.slice(0, 5).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paidAt: p.paid_at.toISOString(),
          note: p.note,
        })),
      };
    });

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  async getLoanById(userId: string, loanId: string) {
    const loan = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
      include: {
        loan_payments: {
          orderBy: { paid_at: "desc" },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    const totalPaid = loan.loan_payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const principal = Number(loan.principal);

    return {
      ...loan,
      principal,
      interest_rate: Number(loan.interest_rate),
      totalPaid,
      remaining: Math.max(0, principal - totalPaid),
    };
  }

  async editLoan(userId: string, loanId: string, dto: EditLoanDto) {
    const existing = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    const updated = await this.prisma.loans.update({
      where: { id: loanId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.direction !== undefined && { direction: dto.direction }),
        ...(dto.principal !== undefined && { principal: dto.principal }),
        ...(dto.interestRate !== undefined && { interest_rate: dto.interestRate }),
        ...(dto.startDate && { start_date: new Date(dto.startDate) }),
        ...(dto.dueDate !== undefined && {
          due_date: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    await this.cacheManager.del(`loans_${userId}`);
    return updated;
  }

  async deleteLoan(userId: string, loanId: string) {
    const existing = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    await this.prisma.loans.delete({ where: { id: loanId } });
    await this.cacheManager.del(`loans_${userId}`);
    return { deleted: true };
  }

  async addPayment(userId: string, loanId: string, dto: AddPaymentDto) {
    const loan = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    const payment = await this.prisma.loan_payments.create({
      data: {
        loan_id: loanId,
        amount: dto.amount,
        paid_at: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        note: dto.note || null,
      },
    });

    await this.cacheManager.del(`loans_${userId}`);
    return payment;
  }

  async editPayment(userId: string, loanId: string, paymentId: string, dto: EditPaymentDto) {
    const loan = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    const payment = await this.prisma.loan_payments.findFirst({
      where: { id: paymentId, loan_id: loanId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found for loan ${loanId}`);
    }

    const updated = await this.prisma.loan_payments.update({
      where: { id: paymentId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paidAt ? { paid_at: new Date(dto.paidAt) } : {}),
        ...(dto.note !== undefined && { note: dto.note || null }),
      },
    });

    await this.cacheManager.del(`loans_${userId}`);
    return updated;
  }

  async deletePayment(userId: string, loanId: string, paymentId: string) {
    const loan = await this.prisma.loans.findFirst({
      where: { id: loanId, user_id: userId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    const payment = await this.prisma.loan_payments.findFirst({
      where: { id: paymentId, loan_id: loanId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found for loan ${loanId}`);
    }

    await this.prisma.loan_payments.delete({
      where: { id: paymentId },
    });

    await this.cacheManager.del(`loans_${userId}`);
    return { deleted: true };
  }
}
