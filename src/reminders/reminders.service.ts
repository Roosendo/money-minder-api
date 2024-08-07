import { Inject, Injectable } from '@nestjs/common'
import { Client } from '@libsql/client/.'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import {
  CreateReminderDto,
  GetRemindersDto,
  DeleteReminderDto,
  UpdateReminderDto
} from './reminders.dto'

@Injectable()
export class RemindersService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newReminder({ email, title, description, reminderDate }: CreateReminderDto) {
    const result = await this.client.execute({
      sql: 'INSERT INTO reminders (user_email, title, description, reminder_date) VALUES (?, ?, ?, ?) RETURNING id',
      args: [email, title, description, reminderDate]
    })

    await this.cacheManager.del(`reminders_${email}`)
    const id = result.rows[0]?.id
    return { id }
  }

  @CacheKey('reminders')
  @CacheTTL(60 * 1000)
  async getReminders({ email }: GetRemindersDto) {
    const cacheKey = `reminders_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const reminders = await this.client.execute({
      sql: 'SELECT id, title, description, reminder_date FROM reminders WHERE user_email = ?',
      args: [email]
    })

    return reminders.rows
  }

  async deleteReminder({ email, id }: DeleteReminderDto) {
    await this.client.execute({
      sql: 'DELETE FROM reminders WHERE user_email = ? AND id = ?',
      args: [email, id]
    })

    await this.cacheManager.del(`reminders_${email}`)
  }

  async updateReminder({ email, id, newTitle, newDescription, newDate }: UpdateReminderDto) {
    await this.client.execute({
      sql: 'UPDATE reminders SET title = ?, description = ?, reminder_date = ? WHERE user_email = ? AND id = ?',
      args: [newTitle, newDescription, newDate, email, id]
    })

    await this.cacheManager.del(`reminders_${email}`)
  }
}
