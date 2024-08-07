import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@libsql/client/.'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto'

interface FS {
  totalExits: number | null
}

@Injectable()
export class ExitService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newExpense({ email, date, amount, category, description }: CreateExpenseDto) {
    await this.client.execute({
      sql: 'INSERT INTO money_exits (user_email, amount, description, category, date) VALUES (?, ?, ?, ?, ?)',
      args: [email, amount, description, category, date]
    })

    await this.cacheManager.del(`exits_${email}`)
  }

  @CacheKey('exits')
  @CacheTTL(60 * 1000)
  async getExits({ email }: GetExitsDto) {
    const cacheKey = `exits_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.client.execute({
      sql: 'SELECT amount, description, category, date, exit_id FROM money_exits WHERE user_email = ? ORDER BY exit_id DESC LIMIT 15',
      args: [email]
    })

    await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 })
    return expenses.rows
  }

  @CacheKey('monthlyExpenses_exits')
  @CacheTTL(60 * 1000)
  async getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto) {
    const cacheKey = `monthlyExpenses_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.client.execute({
      sql: 'SELECT category, SUM(amount) AS total FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
      args: [email, month, year]
    })

    await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 })
    return expenses.rows
  }

  @CacheKey('mothlySummary_exits')
  @CacheTTL(60 * 1000)
  async getMonthlySummary({ email, month, year }: MonthlyExitDto) {
    const cacheKey = `monthlySummary_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get<FS[]>(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
      args: [email, month, year]
    })

    await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 })
    return expenses.rows
  }

  @CacheKey('yearlySummary_exits')
  @CacheTTL(60 * 1000)
  async getYearlySummary({ email, year }: YearlyExitDto) {
    const cacheKey = `yearlySummary_${email}_${year}`
    const cacheData = await this.cacheManager.get<FS[]>(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.client.execute({
      sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%Y", date) = ?',
      args: [email, year]
    })

    await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 })
    return expenses.rows
  }
}
