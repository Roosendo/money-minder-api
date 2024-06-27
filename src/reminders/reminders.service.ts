import { Inject, Injectable } from '@nestjs/common'
import {
  CreateReminderDto,
  GetRemindersDto,
  DeleteReminderDto,
  UpdateReminderDto
} from './reminders.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class RemindersService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: Client) { }

  async newReminder (
    { email, title, description, reminderDate }: CreateReminderDto
  ) {
    await this.client.execute({
      sql: 'INSERT INTO reminders (user_email, title, description, reminder_date) VALUES (?, ?, ?, ?)',
      args: [email, title, description, reminderDate]
    })
  }

  async getReminders ({ email }: GetRemindersDto) {
    const reminders = await this.client.execute({
      sql: 'SELECT id, title, description, reminder_date FROM reminders WHERE user_email = ?',
      args: [email]
    })

    return reminders.rows
  }

  async deleteReminder (
    { email, id }: DeleteReminderDto
  ) {
    await this.client.execute({
      sql: 'DELETE FROM reminders WHERE user_email = ? AND id = ?',
      args: [email, id]
    })
  }

  async updateReminder (
    { email, id, newTitle, newDescription, newDate }: UpdateReminderDto
  ) {
    await this.client.execute({
      sql: 'UPDATE reminders SET title = ?, description = ?, reminder_date = ? WHERE user_email = ? AND id = ?',
      args: [newTitle, newDescription, newDate, email, id]
    })
  }
}
