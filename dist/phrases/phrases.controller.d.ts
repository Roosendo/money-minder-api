import { CacheStore } from '@nestjs/cache-manager';
import { PhrasesService } from './phrases.service';
export declare class PhrasesController {
    private readonly phrasesService;
    private cacheManager;
    constructor(phrasesService: PhrasesService, cacheManager: CacheStore);
    getPhrases(): Promise<unknown>;
}
