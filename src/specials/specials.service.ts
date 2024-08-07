import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@libsql/client/.'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CashFlowDto, CategoriesDto, RecentTransactionsDto } from './specials.dto'

@Injectable()
export class SpecialsService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  @CacheKey('financialSummaryYearly')
  @CacheTTL(60 * 1000)
  async getCashFlow({ email, year }: CashFlowDto) {
    const cacheKey = `financialSummaryYearly_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const cashFlow = await this.client.execute({
      sql: `SELECT
            month,
            SUM(total_ingresos) AS total_ingresos,
            SUM(total_egresos) AS total_egresos
          FROM
            (
              SELECT
                STRFTIME('%m', DATE) AS month,
                SUM(amount) AS total_ingresos,
                0 AS total_egresos
              FROM
                money_entries
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
              UNION ALL
              SELECT
                STRFTIME('%m', DATE) AS month,
                0 AS total_ingresos,
                SUM(amount) AS total_egresos
              FROM
                money_exits
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
            )
          GROUP BY
            month
          ORDER BY
            month`,
      args: [year, email, year, email]
    })

    await this.cacheManager.set(cacheKey, cashFlow.rows, { ttl: 60 * 1000 })
    return cashFlow.rows
  }

  @CacheKey('categories')
  @CacheTTL(60 * 1000)
  async getCategories({ email, year }: CategoriesDto) {
    const cacheKey = `categories_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const categories = await this.client.execute({
      sql: `SELECT category, SUM(amount) AS total
      FROM (
          SELECT category, amount, date
          FROM money_entries
          WHERE user_email = ? AND strftime("%Y", date) = ?
          UNION ALL
          SELECT category, amount AS amount, date
          FROM money_exits
          WHERE user_email = ? AND strftime("%Y", date) = ?
      ) AS combined
      GROUP BY category
      `,
      args: [email, year, email, year]
    })

    await this.cacheManager.set(cacheKey, categories.rows, { ttl: 60 * 1000 })
    return categories.rows
  }

  @CacheKey('recentTransactions')
  @CacheTTL(60 * 1000)
  async getRecentTransactions({ email, year }: RecentTransactionsDto) {
    const cacheKey = `recentTransactions_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const transactions = await this.client.execute({
      sql: `SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                date,
                category,
                amount
              FROM
                money_entries
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                entry_id DESC
              LIMIT
                4
            ) AS latest_entries
          UNION ALL
          SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                category,
                amount,
                date
              FROM
                money_exits
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                exit_id DESC
              LIMIT
                4
            ) AS latest_exits
          ORDER BY
            date DESC
          `,
      args: [email, year, email, year]
    })

    await this.cacheManager.set(cacheKey, transactions.rows, { ttl: 60 * 1000 })
    return transactions.rows
  }
}
