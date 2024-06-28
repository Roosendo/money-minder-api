import { PhrasesService } from './phrases.service';
export declare class PhrasesController {
    private readonly phrasesService;
    constructor(phrasesService: PhrasesService);
    getPhrases(): Promise<{
        phrase: string;
        movie: string;
        character: string;
    }>;
}
