import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto, YearlyExitDto } from './exits.dto'
import { PrismaService } from '@/prisma.service'

interface FS {
  _sum: number
}

@Injectable()
export class ExitService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newExpense({ email, date, amount, category, description, creditCardId, isCreditPayment }: CreateExpenseDto) {
    const id = await this.prisma.money_exits.create({
      data: {
        user_email: email,
        amount,
        description,
        category,
        date,
        credit_card_id: creditCardId,
        is_credit_payment: isCreditPayment
      },
      select: { exit_id: true }
    })

    await this.cacheManager.del(`exits_${email}`)
    return id
  }

  @CacheKey('exits')
  @CacheTTL(60 * 1000)
  async getExits({ email }: GetExitsDto) {
    const cacheKey = `exits_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.prisma.money_exits.findMany({
      where: { user_email: email },
      orderBy: { exit_id: 'desc' },
      take: 15,
      select: {
        amount: true,
        description: true,
        category: true,
        date: true,
        exit_id: true,
        credit_card_id: true,
        is_credit_payment: true
      }
    })

    await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 })
    return expenses
  }

  @CacheKey('monthlyExpenses_exits')
  @CacheTTL(60 * 1000)
  async getExpensesByCategoryMonthly({ email, month, year }: MonthlyExitDto) {
    const cacheKey = `monthlyExpenses_exits_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.prisma.money_exits.groupBy({
      by: ['category'],
      where: {
        user_email: email,
        date: { gte: new Date(`${year}-${month}-01`), lt: new Date(`${year}-${month}-32`) }
      },
      _sum: { amount: true }
    })

    await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 })
    return expenses
  }

  @CacheKey('mothlySummary_exits')
  @CacheTTL(60 * 1000)
  async getMonthlySummary({ email, month, year }: MonthlyExitDto) {
    const cacheKey = `monthlySummary_exits_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get<FS>(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.prisma.money_exits.aggregate({
      where: {
        user_email: email,
        date: { gte: new Date(`${year}-${month}-01`), lt: new Date(`${year}-${month}-32`) }
      },
      _sum: { amount: true }
    })

    await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 })
    return expenses
  }

  @CacheKey('yearlySummary_exits')
  @CacheTTL(60 * 1000)
  async getYearlySummary({ email, year }: YearlyExitDto) {
    const cacheKey = `yearlySummary_exits_${email}_${year}`
    const cacheData = await this.cacheManager.get<FS>(cacheKey)
    if (cacheData) return cacheData

    const expenses = await this.prisma.money_exits.aggregate({
      where: {
        user_email: email,
        date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year}-12-32`) }
      },
      _sum: { amount: true }
    })

    await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 })
    return expenses
  }
}
