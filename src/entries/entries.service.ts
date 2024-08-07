import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@libsql/client/.'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto'

interface FS {
  totalEntries: number | null
}

@Injectable()
export class EntryService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newEntry({ email, date, amount, category, description }: CreateEntryDto) {
    await this.client.execute({
      sql: 'INSERT INTO money_entries (user_email, DATE, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      args: [email, date, amount, category, description]
    })

    await this.cacheManager.del(`entries_${email}`)
  }

  @CacheKey('entries')
  @CacheTTL(60 * 1000)
  async getEntries({ email }: GetEntriesDto) {
    const cacheKey = `entries_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.client.execute({
      sql: 'SELECT amount, description, category, DATE, entry_id FROM money_entries WHERE user_email = ? ORDER BY entry_id DESC LIMIT 15',
      args: [email]
    })

    await this.cacheManager.set(cacheKey, entries.rows, { ttl: 60 * 1000 })
    return entries.rows
  }

  @CacheKey('monthlyEntries_entries')
  @CacheTTL(60 * 1000)
  async getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto) {
    const cacheKey = `monthlyEntries_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    await this.cacheManager.set(cacheKey, entries.rows, { ttl: 60 * 1000 })
    return entries.rows
  }

  @CacheKey('mothlySummary_entries')
  @CacheTTL(60 * 1000)
  async getMonthlySummary({ email, month, year }: MonthlyEntryDto) {
    const cacheKey = `monthlySummary_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get<FS[]>(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    await this.cacheManager.set(cacheKey, entries.rows, { ttl: 60 * 1000 })
    return entries.rows
  }

  @CacheKey('yearlySummary_entries')
  @CacheTTL(60 * 1000)
  async getYearlySummary({ email, year }: YearlyEntryDto) {
    const cacheKey = `yearlySummary_${email}_${year}`
    const cacheData = await this.cacheManager.get<FS[]>(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    await this.cacheManager.set(cacheKey, entries.rows, { ttl: 60 * 1000 })
    return entries.rows
  }
}
