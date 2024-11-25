import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto'
import { PrismaService } from '@/prisma.service'

@Injectable()
export class SavingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newSaving({
    email,
    name,
    targetAmount,
    currentAmount,
    startDate,
    endDate
  }: CreateSavingDto) {
    const saving = await this.prisma.savings_goals.create({
      data: {
        user_email: email,
        name,
        target_amount: targetAmount,
        current_amount: currentAmount,
        start_date: new Date(startDate),
        end_date: new Date(endDate)
      },
      select: { id: true }
    })
    const interceptedId = Number(saving.id)

    await this.cacheManager.del(`savings_${email}`)
    return { id: interceptedId }
  }

  @CacheKey('savings')
  @CacheTTL(60 * 1000)
  async getSavings({ email }: GetSavingsDto) {
    const cacheKey = `savings_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const savings = await this.prisma.savings_goals.findMany({
      where: { user_email: email },
      select: {
        id: true,
        name: true,
        target_amount: true,
        current_amount: true,
        end_date: true
      }
    })

    await this.cacheManager.set(cacheKey, savings, { ttl: 60 * 1000 })
    return savings
  }

  async deleteSaving({ email, id }: DeleteSavingDto) {
    await this.prisma.savings_goals.delete({
      where: {
        user_email: email,
        id: +id
      }
    })

    await this.cacheManager.del(`savings_${email}`)
  }

  async updateSaving({
    email,
    id,
    newSavingName,
    newTarget,
    newCurrentAmount,
    newEndDate
  }: UpdateSavingDto) {
    await this.prisma.savings_goals.updateMany({
      where: {
        user_email: email,
        id: +id
      },
      data: {
        name: newSavingName,
        target_amount: newTarget,
        current_amount: newCurrentAmount,
        end_date: new Date(newEndDate)
      }
    })

    await this.cacheManager.del(`savings_${email}`)
  }
}
