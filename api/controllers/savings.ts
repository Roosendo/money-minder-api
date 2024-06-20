import type { Request, Response, NextFunction } from 'express'
import Savings from '../models/savings.js'
import type { newGoal, singleGoal, updatedGoal } from '../types'

export default class SavingsController {
  async newSaving (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, targetAmount, currentAmount, startDate, endDate } = req.body as newGoal
      if (!email || !name || !targetAmount || !currentAmount || !startDate || !endDate) return next(new Error('All fields are required'))
      await Savings.newSaving({ email, name, targetAmount, currentAmount, startDate, endDate })
      res.json({ message: 'Saving goal added successfully' })
    } catch (error) {
      next(error)
    }
  }

  async getSavings (req: Request, res: Response, next: NextFunction) {
    try {
      const { email }: { email: string } = req.body
      if (!email) return next(new Error('Email is required'))
      const savings = await Savings.getSavings({ email })
      res.json(savings)
    } catch (error) {
      next(error)
    }
  }

  async deleteSaving (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, id }: singleGoal = req.body
      if (!email || !id) return next(new Error('Email and id are required'))
      await Savings.deleteSaving({ email, id })
      res.json({ message: 'Saving goal deleted successfully' })
    } catch (error) {
      next(error)
    }
  }

  async updateSaving (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: updatedGoal = req.body
      if (!email || !id || !newSavingName || !newTarget || !newCurrentAmount || !newEndDate) return next(new Error('All fields are required'))
      await Savings.updateSaving({ email, id, newSavingName, newTarget, newCurrentAmount, newEndDate })
      res.json({ message: 'Saving goal updated successfully' })
    } catch (error) {
      next(error)
    }
  }
}
