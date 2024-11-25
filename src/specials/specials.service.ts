import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CashFlowDto, CategoriesDto, RecentTransactionsDto } from './specials.dto'
import { getCategoryTotalsDetailed, getLatestTransactions, getMonthlyBalance } from './specials.utils'

@Injectable()
export class SpecialsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  @CacheKey('financialSummaryYearly')
  @CacheTTL(60 * 1000)
  async getCashFlow({ email, year }: CashFlowDto) {
    const cacheKey = `financialSummaryYearly_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const result = await getMonthlyBalance(year, email)

    await this.cacheManager.set(cacheKey, result, { ttl: 60 * 1000 })
    return result
  }

  @CacheKey('categories')
  @CacheTTL(60 * 1000)
  async getCategories({ email, year }: CategoriesDto) {
    const cacheKey = `categories_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const categories = await getCategoryTotalsDetailed(year, email)

    await this.cacheManager.set(cacheKey, categories, { ttl: 60 * 1000 })
    return categories
  }

  @CacheKey('recentTransactions')
  @CacheTTL(60 * 1000)
  async getRecentTransactions({ email, year }: RecentTransactionsDto) {
    const cacheKey = `recentTransactions_${email}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const transactions = await getLatestTransactions(year, email)

    await this.cacheManager.set(cacheKey, transactions, { ttl: 60 * 1000 })
    return transactions
  }
}
