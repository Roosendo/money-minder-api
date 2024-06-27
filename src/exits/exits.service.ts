import { Inject, Injectable } from '@nestjs/common'
import {
  CreateExpenseDto,
  GetExitsDto,
  MonthlyExitDto,
  YearlyExitDto
} from './exits.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class ExitService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: Client) { }

  async newExpense (
    { email, date, amount, category, description }: CreateExpenseDto
  ) {
    await this.client.execute({
      sql: 'INSERT INTO money_exits (user_email, amount, description, category, date) VALUES (?, ?, ?, ?, ?)',
      args: [email, amount, description, category, date]
    })
  }

  async getExits (
    { email }: GetExitsDto
  ) {
    const expenses = await this.client.execute({
      sql: 'SELECT amount, description, category, date FROM money_exits WHERE user_email = ? ORDER BY exit_id DESC LIMIT 15',
      args: [email]
    })

    return expenses.rows
  }

  async getExpensesByCategoryMonthly (
    { email, month, year }: MonthlyExitDto
  ) {
    const expenses = await this.client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    return expenses.rows
  }

  async getMonthlySummary (
    { email, month, year }: MonthlyExitDto
  ) {
    const expenses = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    return expenses.rows
  }

  async getYearlySummary (
    { email, year }: YearlyExitDto
  ) {
    const expenses = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    return expenses.rows
  }
}
