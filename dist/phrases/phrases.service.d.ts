export declare class PhrasesService {
    getPhrases(): Promise<{
        phrase: string;
        movie: string;
        character: string;
    }[]>;
}
