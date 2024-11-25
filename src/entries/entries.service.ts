import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateEntryDto, GetEntriesDto, MonthlyEntryDto, YearlyEntryDto } from './entries.dto'
import { PrismaService } from '@/prisma.service'

interface FS {
  _sum: number
}

@Injectable()
export class EntryService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newEntry({ email, date, amount, category, description }: CreateEntryDto) {
    const id = await this.prisma.money_entries.create({
      data: {
        user_email: email,
        date: new Date(date),
        amount,
        category,
        description
      },
      select: { entry_id: true }
    })

    await this.cacheManager.del(`entries_${email}`)
    return id
  }

  @CacheKey('entries')
  @CacheTTL(60 * 1000)
  async getEntries({ email }: GetEntriesDto) {
    const cacheKey = `entries_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.prisma.money_entries.findMany({
      where: { user_email: email },
      orderBy: { entry_id: 'desc' },
      take: 15,
      select: {
        amount: true,
        description: true,
        category: true,
        date: true,
        entry_id: true
      }
    })

    await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 })
    return entries
  }

  @CacheKey('monthlyEntries_entries')
  @CacheTTL(60 * 1000)
  async getEntriesByCategoryMonthly({ email, month, year }: MonthlyEntryDto) {
    const cacheKey = `monthlyEntries_entries_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.prisma.money_entries.groupBy({
      by: ['category'],
      where: {
        user_email: email,
        date: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${month}-32`)
        }
      },
      _sum: {
        amount: true,
      }
    })

    await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 })
    return entries
  }

  @CacheKey('mothlySummary_entries')
  @CacheTTL(60 * 1000)
  async getMonthlySummary({ email, month, year }: MonthlyEntryDto) {
    const cacheKey = `monthlySummary_entries_${email}_${month}_${year}`
    const cacheData = await this.cacheManager.get<FS>(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.prisma.money_entries.aggregate({
      where: { 
        user_email: email,
        date: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(`${year}-${month}-32`)
        }
      },
      _sum: {
        amount: true
      }
    })

    await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 })
    return entries
  }

  @CacheKey('yearlySummary_entries')
  @CacheTTL(60 * 1000)
  async getYearlySummary({ email, year }: YearlyEntryDto) {
    const cacheKey = `yearlySummary_entries_${email}_${year}`
    const cacheData = await this.cacheManager.get<FS>(cacheKey)
    if (cacheData) return cacheData

    const entries = await this.prisma.money_entries.aggregate({
      where: {
        user_email: email,
        date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year}-12-32`)
        }
      },
      _sum: {
        amount: true
      }
    })

    await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 })
    return entries
  }
}
