import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Controller, Get, Inject } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { PhrasesService } from "./phrases.service";

@Controller("phrases")
export class PhrasesController {
  constructor(
    private readonly phrasesService: PhrasesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Public()
  @Get("daily-phrase")
  async getPhrases() {
    const today = new Date();
    const cacheKey = `daily_phrase_${today.getDate()}`;
    const cachedPhrase = await this.cacheManager.get(cacheKey);
    if (cachedPhrase) return cachedPhrase;

    const phrases = await this.phrasesService.getPhrases();
    if (!phrases || !phrases.length) return null;

    const index = today.getDate() % phrases.length;
    const dailyPhrase = phrases[index];

    await this.cacheManager.set(cacheKey, dailyPhrase, 24 * 60 * 60 * 1000);
    return dailyPhrase;
  }
}
