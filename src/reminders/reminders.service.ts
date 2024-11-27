import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import {
  CreateReminderDto,
  GetRemindersDto,
  DeleteReminderDto,
  UpdateReminderDto
} from './reminders.dto'
import { PrismaService } from '@/prisma.service'

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

  async newReminder({ email, title, description, reminderDate }: CreateReminderDto) {
    const result = await this.prisma.reminders.create({
      data: {
        user_email: email,
        title,
        description,
        reminder_date: new Date(reminderDate)
      },
      select: { id: true }
    })

    await this.cacheManager.del(`reminders_${email}`)
    return { id: result.id }
  }

  @CacheKey('reminders')
  @CacheTTL(60 * 1000)
  async getReminders({ email }: GetRemindersDto) {
    const cacheKey = `reminders_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const reminders = await this.prisma.reminders.findMany({
      where: { user_email: email },
      select: { id: true, title: true, description: true, reminder_date: true }
    })

    return reminders
  }

  async deleteReminder({ email, id }: DeleteReminderDto) {
    await this.prisma.reminders.delete({
      where: { user_email: email, id: +id }
    })

    await this.cacheManager.del(`reminders_${email}`)
  }

  async updateReminder({ email, id, newTitle, newDescription, newDate }: UpdateReminderDto) {
    await this.prisma.reminders.update({
      where: { user_email: email, id: +id },
      data: { title: newTitle, description: newDescription, reminder_date: new Date(newDate) }
    })

    await this.cacheManager.del(`reminders_${email}`)
  }
}
