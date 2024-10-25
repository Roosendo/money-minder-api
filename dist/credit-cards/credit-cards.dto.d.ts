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
    creditCardId?: string;
    userEmail: string;
}
export type PurchaseRange = {
    email: string;
    cutOffDate: string;
    paymentDueDate: string;
};
export type ApiPurchases = {
    cut_off_date: string;
    payment_due_date: string;
};
