import type { Request, Response, NextFunction } from 'express'
import Entry from '../models/entries.js'
import Exit from '../models/exits.js'

export default class SpecialController {
  async financialSumaryYearly (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as { email: string, year: string }
      if (!email || !year) return next(new Error('Email and year are required'))
      const entries = await Entry.getYearlySummary({ email, year })
      const exits = await Exit.getYearlySummary({ email, year })

      const totalEntries = entries[0]?.totalEntries || 0
      const totalExits = exits[0]?.totalExits || 0

      res.json({ totalEntries, totalExits })
    } catch (err) {
      next(err)
    }
  }

  async financialSumaryMonthly (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, month, year } = req.query as unknown as { email: string, month: string, year: string }
      if (!email || !month || !year) return next(new Error('Email, month, and year are required'))
      const entries = await Entry.getMonthlySummary({ email, month, year })
      const exits = await Exit.getMonthlySummary({ email, month, year })

      const totalEntries = entries[0]?.totalEntries || 0
      const totalExits = exits[0]?.totalExits || 0

      res.json({ totalEntries, totalExits })
    } catch (err) {
      next(err)
    }
  }

  async cashFlow (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as { email: string, year: string }
      if (!email || !year) return next(new Error('Email and year are required'))
      const entries = await Entry.getEntryCashFlow({ email, year })
      const exits = await Exit.getExpenseCashFlow({ email, year })

      if (entries.length === 0 && exits.length === 0) return next(new Error('Both entries and exits are empty'))

      if (entries.length === 0) return res.json({ exits })
      if (exits.length === 0) return res.json({ entries })

      res.json([ ...entries, ...exits ])
    } catch (err) {
      next(err)
    }
  }

  async yearlyCategories (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as { email: string, year: string }
      if (!email || !year) return next(new Error('Email and year are required'))
      const entries = await Entry.getEntriesByCategoryYearly({ email, year })
      const exits = await Exit.getExpensesByCategoryYearly({ email, year })

      if (entries.length === 0 && exits.length === 0) return next(new Error('Both entries and exits are empty'))

      if (entries.length === 0) return res.json({ exits })
      if (exits.length === 0) return res.json({ entries })

      res.json([ ...entries, ...exits ])
    } catch (err) {
      next(err)
    }
  }
}
