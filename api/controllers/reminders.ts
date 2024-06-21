import type { Request, Response, NextFunction } from 'express'
import Reminder from '../models/reminders.js'
import type { newReminder, singleReminder, updatedReminder } from '../types'

export default class ReminderController {
  async newReminder (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, title, description, reminderDate } = req.body as newReminder
      if (!email || !title || !reminderDate) return next(new Error('All fields are required'))
      await Reminder.newReminder({ email, title, description, reminderDate })
      res.json({ message: 'Reminder added successfully' })
    } catch (err) {
      next(err)
    }
  }

  async getReminders (req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query as unknown as { email: string }
      if (!email) return next(new Error('Email is required'))
      const reminders = await Reminder.getReminders({ email })
      res.json(reminders)
    } catch (err) {
      next(err)
    }
  }

  async deleteReminder (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, id } = req.query as unknown as singleReminder
      if (!email || !id) return next(new Error('Email and ID are required'))
      await Reminder.deleteReminder({ email, id })
      res.json({ message: 'Reminder deleted successfully' })
    } catch (err) {
      next(err)
    }
  }

  async updateReminder (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, id, newTitle, newDescription, newDate } = req.body as updatedReminder
      if (!email || !id || !newTitle || !newDate) return next(new Error('All fields are required'))
      await Reminder.updateReminder({ email, id, newTitle, newDescription, newDate })
      res.json({ message: 'Reminder updated successfully' })
    } catch (err) {
      next(err)
    }
  }
}
