import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@libsql/client/.'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto'

@Injectable()
export class SavingsService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
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
    const saving = await this.client.execute({
      sql: 'INSERT INTO savings_goals (user_email, name, target_amount, current_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      args: [email, name, targetAmount, currentAmount, startDate, endDate]
    })

    await this.cacheManager.del(`savings_${email}`)
    const id = saving.rows[0]?.id
    return { id }
  }

  @CacheKey('savings')
  @CacheTTL(60 * 1000)
  async getSavings({ email }: GetSavingsDto) {
    const cacheKey = `savings_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const savings = await this.client.execute({
      sql: 'SELECT id, name, target_amount, current_amount, end_date FROM savings_goals WHERE user_email = ?',
      args: [email]
    })

    await this.cacheManager.set(cacheKey, savings.rows, { ttl: 60 * 1000 })
    return savings.rows
  }

  async deleteSaving({ email, id }: DeleteSavingDto) {
    await this.client.execute({
      sql: 'DELETE FROM savings_goals WHERE user_email = ? AND id = ?',
      args: [email, id]
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
    await this.client.execute({
      sql: 'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, end_date = ? WHERE user_email = ? AND id = ?',
      args: [newSavingName, newTarget, newCurrentAmount, newEndDate, email, id]
    })

    await this.cacheManager.del(`savings_${email}`)
  }
}
