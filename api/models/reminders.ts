import { client } from '../config/tursoClient.js'
import type { newReminder, singleReminder, updatedReminder } from '../types'

export default class Reminder {
  static async newReminder (
    { email, title, description, reminderDate }: newReminder
  ) {
    await client.execute({
      sql: 'INSERT INTO reminders (user_email, title, description, reminder_date) VALUES (?, ?, ?, ?)',
      args: [email, title, description, reminderDate]
    })
  }

  static async getReminders (
    { email }: { email: string }
  ) {
    const reminders = await client.execute({
      sql: 'SELECT id, title, description, reminder_date FROM reminders WHERE user_email = ?',
      args: [email]
    })

    return reminders
  }

  static async deleteReminder (
    { email, id }: singleReminder
  ) {
    await client.execute({
      sql: 'DELETE FROM reminders WHERE user_email = ? AND id = ?',
      args: [email, id]
    })
  }

  static async updateReminder (
    { email, id, newTitle, newDescription, newDate }: updatedReminder
  ) {
    await client.execute({
      sql: 'UPDATE reminders SET title = ?, description = ?, reminder_date = ? WHERE user_email = ? AND id = ?',
      args: [newTitle, newDescription, newDate, email, id]
    })
  }
}
