import { Cache } from '@nestjs/cache-manager';
import { PhrasesService } from './phrases.service';
export declare class PhrasesController {
    private readonly phrasesService;
    private cacheManager;
    constructor(phrasesService: PhrasesService, cacheManager: Cache);
    getPhrases(): Promise<unknown>;
}
