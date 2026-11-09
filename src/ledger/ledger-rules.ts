import { account_type, transaction_type } from "@prisma/client";
import { dec, MoneyLike, ZERO } from "@/common/money";

export type AdjustmentDirection = "increase" | "decrease";

export const ASSET_ACCOUNT_TYPES: account_type[] = ["cash", "bank", "savings"];
export const ACCOUNT_TYPES: account_type[] = ["cash", "bank", "savings", "credit_card"];

export const isLiabilityAccount = (type: account_type): boolean => type === "credit_card";
export const isAssetAccount = (type: account_type): boolean => !isLiabilityAccount(type);

/**
 * Returns the signed ledger movement for a transaction on an account.
 *
 * Asset accounts (cash, bank, savings):
 *   income +, expense -, adjustment increase +, adjustment decrease -
 *
 * Credit card accounts (liabilities):
 *   expense (purchase) +, income (refund/credit) -,
 *   adjustment increase (more debt) +, adjustment decrease (less debt) -
 */
export const movementForTransaction = (
  accountType: account_type,
  transactionType: transaction_type,
  amount: MoneyLike,
  direction?: AdjustmentDirection,
): ReturnType<typeof dec> => {
  const value = dec(amount);

  switch (transactionType) {
    case "income":
      return isLiabilityAccount(accountType) ? value.negated() : value;
    case "expense":
      return isLiabilityAccount(accountType) ? value : value.negated();
    case "adjustment":
      if (!direction) {
        throw new Error("Adjustment transactions require a direction (increase|decrease)");
      }
      return direction === "increase" ? value : value.negated();
    case "transfer":
      throw new Error("Use movementForTransfer for transfer transactions");
    default:
      return value;
  }
};

/**
 * Transfer movements:
 *   source (asset only): -(amount + fee)
 *   destination (asset): +amount
 *   destination (credit card): -amount (a payment reduces debt)
 *
 * The fee therefore leaves the source account without ever appearing as an
 * income/expense transaction. Reports expose it through transfers.fee.
 */
export const movementForTransfer = (
  accountType: account_type,
  side: "from" | "to",
  amount: MoneyLike,
  fee: MoneyLike = ZERO(),
): ReturnType<typeof dec> => {
  const principal = dec(amount);
  const transferFee = dec(fee);

  if (side === "from") {
    if (isLiabilityAccount(accountType)) {
      throw new Error("Credit card accounts cannot be the source of a transfer");
    }
    return principal.plus(transferFee).negated();
  }

  return isLiabilityAccount(accountType) ? principal.negated() : principal;
};

export const computeBalance = (
  openingBalance: MoneyLike,
  movements: MoneyLike[],
): ReturnType<typeof dec> =>
  movements.reduce<ReturnType<typeof dec>>(
    (balance, movement) => balance.plus(dec(movement)),
    dec(openingBalance),
  );

export const computeAvailableCredit = (
  creditLimit: MoneyLike,
  outstandingDebt: MoneyLike,
): ReturnType<typeof dec> => dec(creditLimit).minus(dec(outstandingDebt));

/** Deterministic, timezone-independent ledger ordering. */
export const compareLedgerEntries = (
  a: { occurredAt: Date; createdAt: Date; transactionId: string; movementId: string },
  b: { occurredAt: Date; createdAt: Date; transactionId: string; movementId: string },
): number => {
  const occurred = a.occurredAt.getTime() - b.occurredAt.getTime();
  if (occurred !== 0) return occurred;
  const created = a.createdAt.getTime() - b.createdAt.getTime();
  if (created !== 0) return created;
  if (a.transactionId !== b.transactionId) return a.transactionId.localeCompare(b.transactionId);
  return a.movementId.localeCompare(b.movementId);
};
