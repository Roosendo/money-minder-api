import { client } from '../config/tursoClient.js'
import type { newIncome, monthlyEntry, yearlyEntry } from '../types'

export default class Entry {
  static async newEntry (
    { email, date, amount, category, description }: newIncome
  ) {
    await client.execute({
      sql: 'INSERT INTO money_entries (user_email, DATE, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      args: [email, date, amount, category, description]
    })
  }

  static async getEntries (
    { email }: { email: string }
  ) {
    const entries = await client.execute({
      sql: 'SELECT amount, description, category, DATE FROM money_entries WHERE user_email = ? ORDER BY entry_id DESC LIMIT 15',
      args: [email]
    })

    return entries.rows
  }

  static async getEntriesByCategoryMonthly (
    { email, month, year }: monthlyEntry
  ) {
    const entries = await client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    return entries.rows
  }

  static async getMonthlySummary (
    { email, month, year }: monthlyEntry
  ) {
    const entries = await client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    return entries.rows
  }

  static async getYearlySummary (
    { email, year }: yearlyEntry
  ) {
    const entries = await client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    return entries.rows
  }
}
