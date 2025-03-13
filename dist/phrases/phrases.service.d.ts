import { Cache } from '@nestjs/cache-manager';
export declare class PhrasesService {
    private cacheManager;
    constructor(cacheManager: Cache);
    getPhrases(): Promise<{
        phrase: string;
        movie: string;
        character: string;
    }[]>;
}
