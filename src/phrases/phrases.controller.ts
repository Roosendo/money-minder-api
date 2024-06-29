import { Controller, Get, UseFilters } from '@nestjs/common'
import { PhrasesService } from './phrases.service'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('api/phrases')
@UseFilters(AllExceptionsFilter)
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) {}

  @Get('daily-phrase')
  async getPhrases() {
    const today = new Date()
    const phrases = await this.phrasesService.getPhrases()
    const index = today.getDate() % phrases.length
    return phrases[index]
  }
}
