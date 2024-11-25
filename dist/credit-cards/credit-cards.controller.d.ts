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
    getPurchases(email: string): Promise<{
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
