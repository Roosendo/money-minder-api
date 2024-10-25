import { CreditCardsService } from './credit-cards.service';
import { UsersService } from '@/users/users.service';
import { CreateCreditCardDto, DeleteCreditCardDto, EditCreditCardDto, GetCreditCardsDto } from './credit-cards.dto';
export declare class CreditCardsController {
    private readonly creditCardsService;
    private readonly usersService;
    constructor(creditCardsService: CreditCardsService, usersService: UsersService);
    newCreditCard(createCreditCardDto: CreateCreditCardDto): Promise<void>;
    getCreditCards(getCreditCardsDto: GetCreditCardsDto): Promise<unknown>;
    editCreditCard(editCreditCardDto: EditCreditCardDto, creditCardId: string): Promise<void>;
    deleteCreditCard(deleteCreditCardDto: DeleteCreditCardDto, creditCardId: string): Promise<void>;
    getPurchases(email: string): Promise<import("@libsql/client/.").Row[]>;
}
