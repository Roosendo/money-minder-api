import { CacheStore } from '@nestjs/cache-manager';
export declare class PhrasesService {
    private cacheManager;
    constructor(cacheManager: CacheStore);
    getPhrases(): Promise<{
        phrase: string;
        movie: string;
        character: string;
    }[]>;
}
