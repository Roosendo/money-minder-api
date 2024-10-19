export declare class CreateCreditCardDto {
    fullName?: string;
    email: string;
    name: string;
    cutOffDate: string;
    paymentDueDate: string;
}
export declare class GetCreditCardsDto {
    email: string;
}
export declare class EditCreditCardDto {
    creditCardId?: string;
    userEmail: string;
    name?: string;
    cutOffDate?: string;
    paymentDueDate?: string;
}
export declare class DeleteCreditCardDto {
    creditCardId: string;
    userEmail: string;
}
