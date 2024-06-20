import type { Request, Response, NextFunction } from 'express'
import Phrases from '../models/phrases.js'

export default class PhrasesController {
  async getDailyPhrase (_req: Request, res: Response, next: NextFunction) {
    try {
      const phrase = await Phrases.getDailyPhrase()
      res.json({ phrase })
    } catch (err) {
      next(err)
    }
  }
}
