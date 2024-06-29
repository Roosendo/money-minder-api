import { Inject, Injectable } from '@nestjs/common'
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class EntryService {
  constructor(@Inject('DATABASE_CLIENT') private readonly client: Client) {}

  async newEntry({ email, date, amount, category, description }: CreateEntryDto) {
    await this.client.execute({
      sql: 'INSERT INTO money_entries (user_email, DATE, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      args: [email, date, amount, category, description]
    })
  }

  async getEntries({ email }: GetEntriesDto) {
    const entries = await this.client.execute({
      sql: 'SELECT amount, description, category, DATE FROM money_entries WHERE user_email = ? ORDER BY entry_id DESC LIMIT 15',
      args: [email]
    })

    return entries.rows
  }

  async getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto) {
    const entries = await this.client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    return entries.rows
  }

  async getMonthlySummary({ email, month, year }: MonthlyEntryDto) {
    const entries = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    return entries.rows
  }

  async getYearlySummary({ email, year }: YearlyEntryDto) {
    const entries = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    return entries.rows
  }
}
