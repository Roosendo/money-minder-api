import type { Request, Response, NextFunction } from 'express'
import Entry from '../models/entries.js'
import type { newIncome, monthlyEntry, yearlyEntry } from '../types'

export default class EntryController {
  async newEntry (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, date, amount, category, description } = req.body as newIncome
      if (!email || !date || !amount || !category) return next(new Error('All fields are required'))
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

  async getMonthlySummary (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, month, year } = req.query as unknown as monthlyEntry
      if (!email || !month || !year) return next(new Error('Email, month, and year are required'))
      const entries = await Entry.getMonthlySummary({ email, month, year })
      if (!entries[0]?.totalEntries) return res.json({ totalEntries: 0 })
      res.json(entries[0])
    } catch (err) {
      next(err)
    }
  }

  async getYearlySummary (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as yearlyEntry
      if (!email || !year) return next(new Error('Email and year are required'))
      const entries = await Entry.getYearlySummary({ email, year })
      if (!entries[0]?.totalEntries) return res.json({ totalEntries: 0 })
      res.json(entries[0])
    } catch (err) {
      next(err)
    }
  }

  async getEntryCashFlow (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as yearlyEntry
      if (!email || !year) return next(new Error('Email, month, and year are required'))
      const entries = await Entry.getEntryCashFlow({ email, year })
      res.json(entries)
    } catch (err) {
      next(err)
    }
  }

  async getEntriesByCategoryYearly (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as yearlyEntry
      if (!email || !year) return next(new Error('Email and year are required'))
      const entries = await Entry.getEntriesByCategoryYearly({ email, year })
      res.json(entries)
    } catch (err) {
      next(err)
    }
  }
}
