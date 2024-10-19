import { Client } from '@libsql/client'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CreateLoanDto, DeleteLoansDto, EditLoansDto, GetLoansDto } from './loans.dto'

@Injectable()
export class LoansService {
  constructor (
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newLoan({ userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }: CreateLoanDto) {
    await this.client.execute({
      sql: 'INSERT INTO loans (user_email, loan_title, bank_name, loan_date, interest_rate, monthly_payment, total_paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid]
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }

  @CacheKey('loans')
  @CacheTTL(60 * 1000)
  async getLoans({ email }: GetLoansDto) {
    const cacheKey = `loans_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const loans = await this.client.execute({
      sql: 'SELECT loan_id, loan_title, bank_name, loan_date, interest_rate, monthly_payment, total_paid FROM loans WHERE user_email = ?',
      args: [email]
    })

    await this.cacheManager.set(cacheKey, loans.rows, { ttl: 60 * 1000 })
    return loans.rows
  }

  async editLoan({ loanId, userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }: EditLoansDto) {
    await this.client.execute({
      sql: 'UPDATE loans SET loan_title = ?, bank_name = ?, loan_date = ?, interest_rate = ?, monthly_payment = ?, total_paid = ? WHERE loan_id = ? AND user_email = ?',
      args: [loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid, loanId, userEmail]
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }

  async deleteLoan({ loanId, userEmail }: DeleteLoansDto) {
    await this.client.execute({
      sql: 'DELETE FROM loans WHERE loan_id = ? AND user_email = ?',
      args: [loanId, userEmail]
    })

    await this.cacheManager.del(`loans_${userEmail}`)
  }
}
