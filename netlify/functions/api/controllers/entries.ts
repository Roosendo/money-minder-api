import type { Request, Response, NextFunction } from 'express'
import Entry from '../models/entries.js'
import User from '../models/user.js'
import type { newIncome, monthlyEntry } from '../types'

export default class EntryController {
  async newEntry (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, fullName, date, amount, category, description } = req.body as newIncome
      if (!email || !fullName || !date || !amount || !category) return next(new Error('All fields are required'))
      await User.createUser({ email, fullName })
      await Entry.newEntry({ email, date, amount, category, description })
      res.json({ message: 'Income added successfully' })
    } catch (err) {
      next(err)
    }
  }

  async getEntries (req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query as { email: string }
      if (!email) return next(new Error('Email is required'))
      const entries = await Entry.getEntries({ email })
      res.json(entries)
    } catch (err) {
      next(err)
    }
  }

  async getEntriesByCategoryMonthly (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, month, year } = req.query as unknown as monthlyEntry
      if (!email || !month || !year) return next(new Error('Email, month, and year are required'))
      const entries = await Entry.getEntriesByCategoryMonthly({ email, month, year })
      res.json(entries)
    } catch (err) {
      next(err)
    }
  }
}
