import type { Request, Response, NextFunction } from 'express'
import Exit from '../models/exits.js'
import type { newExpense, monthlyExpense } from '../types'

export default class ExitController {
  async newExpense (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, date, amount, category, description } = req.body as newExpense
      if (!email || !date || !amount || !category) return next(new Error('All fields are required'))
      await Exit.newExpense({ email, date, amount, category, description })
      res.json({ message: 'Expense added successfully' })
    } catch (err) {
      next(err)
    }
  }

  async getExpenses (req: Request, res: Response, next: NextFunction) {
    try {
      const { email }: { email: string } = req.body
      if (!email) return next(new Error('Email is required'))
      const expenses = await Exit.getExpenses({ email })
      res.json(expenses)
    } catch (err) {
      next(err)
    }
  }

  async getExpensesByCategoryMonthly (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, month, year } = req.body as monthlyExpense
      if (!email || !month || !year) return next(new Error('Email, month, and year are required'))
      const expenses = await Exit.getExpensesByCategoryMonthly({ email, month, year })
      res.json(expenses)
    } catch (err) {
      next(err)
    }
  }
}
