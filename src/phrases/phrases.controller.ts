import { Controller, Get, Inject, UseFilters } from '@nestjs/common'

import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
import { PhrasesService } from './phrases.service'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('api/phrases')
@UseFilters(AllExceptionsFilter)
export class PhrasesController {
  constructor(
    private readonly phrasesService: PhrasesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get('daily-phrase')
  async getPhrases() {
    const today = new Date()
    const cacheKey = `daily_phrase_${today.getDate()}`
    const cachedPhrase = await this.cacheManager.get(cacheKey)
    if (cachedPhrase) return cachedPhrase

    const phrases = await this.phrasesService.getPhrases()
    const index = today.getDate() % phrases.length
    const dailyPhrase = phrases[index]

    await this.cacheManager.set(cacheKey, dailyPhrase, 24 * 60 * 60 * 1000)
    return dailyPhrase
  }
}
