import { Client } from '@libsql/client';
import { CacheStore } from '@nestjs/cache-manager';
import { CreateCreditCardDto, EditCreditCardDto, GetCreditCardsDto, PurchaseRange } from './credit-cards.dto';
export declare class CreditCardsService {
    private readonly client;
    private cacheManager;
    constructor(client: Client, cacheManager: CacheStore);
    newCreditCard({ email, name, cutOffDate, paymentDueDate }: CreateCreditCardDto): Promise<void>;
    getCreditCards({ email }: GetCreditCardsDto): Promise<unknown>;
    editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }: EditCreditCardDto): Promise<void>;
    deleteCreditCard({ creditCardId, userEmail }: EditCreditCardDto): Promise<void>;
    getPurchasesRange({ email }: PurchaseRange): Promise<import("@libsql/client").Row[]>;
}
