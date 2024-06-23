import type { Request, Response, NextFunction } from 'express'
import User from '../models/user.js'

export default class UserController {
  async createUser (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, fullName } = req.body as { email: string, fullName: string }
      if (!email || !fullName) return next(new Error('Email and full name are required'))
      await User.createUser({ email, fullName })

      res.json({ message: 'User created' })
    } catch (err) {
      next(err)
    }
  }
}
