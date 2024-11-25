import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { AddPaymentDTO, CreateLoanDto, DeleteLoansDto, DeletePaymentDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto'
import { PrismaService } from '@/prisma.service'
import { getLoanDetails } from './loans.utils'

@Injectable()
export class LoansService {
  constructor (
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newLoan({ userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: CreateLoanDto) {
    await this.prisma.loans.create({
      data: {
        user_email: userEmail,
        loan_title: loanTitle,
        bank_name: bankName,
        interest_rate: interestRate,
        loan_amount: loanAmount,
        loan_start_date: new Date(loanStartDate),
        loan_end_date: new Date(loanEndDate)
      },
      select: { id: true }
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }

  @CacheKey('loans')
  @CacheTTL(60 * 1000)
  async getLoans({ email }: GetLoansDto) {
    const cacheKey = `loans_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const loans = await getLoanDetails(email)

    await this.cacheManager.set(cacheKey, loans, { ttl: 60 * 1000 })
    return loans
  }

  async editLoan({ loanId, userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: EditLoansDto) {
    await this.prisma.loans.update({
      where: { id: +loanId, user_email: userEmail },
      data: {
        loan_title: loanTitle,
        bank_name: bankName,
        interest_rate: interestRate,
        loan_amount: loanAmount,
        loan_start_date: new Date(loanStartDate),
        loan_end_date: new Date(loanEndDate)
      }
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }

  async deleteLoan({ loanId, userEmail }: DeleteLoansDto) {
    await this.prisma.loans.delete({
      where: { id: +loanId, user_email: userEmail }
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }

  async addPayment({ loanId, paymentDate, paymentAmount }: AddPaymentDTO) {
    return await this.prisma.payments.create({
      data: {
        loan_id: loanId,
        payment_date: new Date(paymentDate),
        payment_amount: paymentAmount
      },
      select: { id: true }
    })
  }

  async editPayment({ paymentId, paymentDate, paymentAmount, email }: EditPaymentDto) {
    await this.prisma.payments.update({
      where: { id: +paymentId },
      data: {
        payment_date: new Date(paymentDate),
        payment_amount: paymentAmount
      }
    })

    await this.cacheManager.del(`loans_${email}`)
  }

  async deletePayment({ paymentId, email }: DeletePaymentDto) {
    await this.prisma.payments.delete({
      where: { id: +paymentId }
    })

    await this.cacheManager.del(`loans_${email}`)
  }
}
