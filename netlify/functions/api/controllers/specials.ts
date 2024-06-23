import type { Request, Response, NextFunction } from 'express'
import Entry from '../models/entries.js'
import Exit from '../models/exits.js'
import Special from '../models/specials.js'

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
      const cashFlow = await Special.getCashFlow({ email, year })

      res.json(cashFlow)
    } catch (err) {
      next(err)
    }
  }

  async yearlyCategories (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, year } = req.query as unknown as { email: string, year: string }
      if (!email || !year) return next(new Error('Email and year are required'))
      const yearlyCategories = await Special.getYearlyCategories({ email, year })

      res.json(yearlyCategories)
    } catch (err) {
      next(err)
    }
  }
}
