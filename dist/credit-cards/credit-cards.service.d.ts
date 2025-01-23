import { CacheStore } from '@nestjs/cache-manager';
import { CreateCreditCardDto, EditCreditCardDto, GetCreditCardsDto, PurchaseRange } from './credit-cards.dto';
import { PrismaService } from '@/prisma.service';
export declare class CreditCardsService {
    private prisma;
    private cacheManager;
    constructor(prisma: PrismaService, cacheManager: CacheStore);
    newCreditCard({ email, name, cutOffDate, paymentDueDate }: CreateCreditCardDto): Promise<void>;
    getCreditCards({ email }: GetCreditCardsDto): Promise<unknown>;
    editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }: EditCreditCardDto): Promise<void>;
    deleteCreditCard({ creditCardId, userEmail }: EditCreditCardDto): Promise<void>;
    getPurchasesRange({ email }: PurchaseRange): Promise<{
        exits: {
            date: Date;
            amount: number;
            description: string;
            exit_id: bigint;
        }[];
        total_amount: number;
        start_cut_off_date: Date;
        end_cut_off_date: Date;
        name: string;
        credit_card_id: bigint;
        cut_off_date: number;
    }[]>;
}
