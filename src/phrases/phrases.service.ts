import { Inject, Injectable } from '@nestjs/common'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
import * as phrases from '../phrases.json'
import { Quote } from './phrases.dto'

@Injectable()
export class PhrasesService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: CacheStore) {}
  async getPhrases() {
    const cacheKey = 'all_phrases'
    const cachedPhrases = await this.cacheManager.get<Quote[] | null>(cacheKey)
    if (cachedPhrases) return cachedPhrases

    // 24 hours in milliseconds (24 * 60 * 60 * 1000)
    await this.cacheManager.set(cacheKey, phrases, { ttl: 24 * 60 * 60 * 1000 })
    return phrases
  }
}
