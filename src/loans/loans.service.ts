import { Client } from '@libsql/client'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { AddPaymentDTO, CreateLoanDto, DeleteLoansDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto'

@Injectable()
export class LoansService {
  constructor (
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newLoan({ userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }: CreateLoanDto) {
    await this.client.execute({
      sql: 'INSERT INTO loans (user_email, loan_title, bank_name, interest_rate, loan_amount, loan_start_date, loan_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate]
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
      sql: `
        SELECT 
        l.loan_title,
        l.bank_name,
        l.interest_rate,
        l.loan_amount,
        l.loan_start_date,
        l.loan_end_date,
        (
          SELECT json_group_array(
            json_object(
              'id', p.id,
              'payment_date', p.payment_date,
              'payment_amount', p.payment_amount
            )
          )
          FROM payments p
          WHERE p.loan_id = l.id
          ORDER BY p.payment_date DESC
          LIMIT 5
        ) AS last_five_payments,
        (
          SELECT IFNULL(SUM(p.payment_amount), 0)
          FROM payments p
          WHERE p.loan_id = l.id
        ) AS total_payments
      FROM 
        loans l
      WHERE 
        l.user_email = ?
      `,
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

  async addPayment({ loanId, paymentDate, paymentAmount }: AddPaymentDTO) {
    await this.client.execute({
      sql: 'INSERT INTO payments (loan_id, payment_date, payment_amount) VALUES (?, ?, ?)',
      args: [loanId, paymentDate, paymentAmount]
    })
  }

  async editPayment({ paymentId, paymentDate, paymentAmount, email }: EditPaymentDto) {
    await this.client.execute({
      sql: 'UPDATE payments SET payment_date = ?, payment_amount = ? WHERE id = ?',
      args: [paymentDate, paymentAmount, paymentId]
    })

    await this.cacheManager.del(`loans_${email}`)
  }
}
