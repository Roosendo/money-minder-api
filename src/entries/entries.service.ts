import { Inject, Injectable } from '@nestjs/common'
import { CreateEntryDto, GetEntriesDto } from './entries.dto'

@Injectable()
export class EntryService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: any) { }

  async newEntry ({ email, date, amount, category, description }: CreateEntryDto) {
    await this.client.execute({
      sql: 'INSERT INTO money_entries (user_email, DATE, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      args: [email, date, amount, category, description]
    })
  }

  async getEntries ({ email }: GetEntriesDto) {
    const entries = await this.client.execute({
      sql: 'SELECT amount, description, category, DATE FROM money_entries WHERE user_email = ? ORDER BY entry_id DESC LIMIT 15',
      args: [email]
    })

    return entries.rows
  }

  // TODO: Implement the following methods
}
