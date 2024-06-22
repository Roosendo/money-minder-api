import { client } from '../config/tursoClient.js'
import type { newExpense, monthlyExpense, yearlyExpense } from '../types'

export default class Exit {
  static async newExpense (
    { email, date, amount, category, description }: newExpense
  ) {
    await client.execute({
      sql: 'INSERT INTO money_exits (user_email, amount, description, category, date) VALUES (?, ?, ?, ?, ?)',
      args: [email, amount, description, category, date]
    })
  }

  static async getExpenses (
    { email }: { email: string }
  ) {
    const expenses = await client.execute({
      sql: 'SELECT amount, description, category, date FROM money_exits WHERE user_email = ? ORDER BY exit_id DESC LIMIT 15',
      args: [email]
    })

    return expenses.rows
  }

  static async getExpensesByCategoryMonthly (
    { email, month, year }: monthlyExpense
  ) {
    const expenses = await client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    return expenses.rows
  }

  static async getMonthlySummary (
    { email, month, year }: monthlyExpense
  ) {
    const expenses = await client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    return expenses.rows
  }

  static async getYearlySummary (
    { email, year }: yearlyExpense
  ) {
    const expenses = await client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    return expenses.rows
  }

  static async getExpenseCashFlow (
    { email, year }: yearlyExpense
  ) {
    const expenses = await client.execute({
      sql: 'SELECT STRFTIME("%m", DATE) AS month, SUM(amount) AS total_egresos FROM money_exits WHERE user_email = ? AND STRFTIME("%Y", DATE) = ? GROUP BY STRFTIME("%m", DATE)',
      args: [email, year]
    })

    return expenses.rows
  }

  static async getExpensesByCategoryYearly (
    { email, year }: yearlyExpense
  ) {
    const expenses = await client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_exits WHERE user_email = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, year]
    })

    return expenses.rows
  }
}
