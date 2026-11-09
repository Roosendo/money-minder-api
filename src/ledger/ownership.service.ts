import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { account_type, category_type, transactions } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { isAssetAccount } from "./ledger-rules";

export interface AccountLookupOptions {
  requireActive?: boolean;
  allowedTypes?: account_type[];
}

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async findAccount(userId: string, accountId: string) {
    return this.prisma.accounts.findFirst({
      where: { id: accountId, user_id: userId },
    });
  }

  async requireAccount(userId: string, accountId: string, options: AccountLookupOptions = {}) {
    const account = await this.findAccount(userId, accountId);

    // Deliberately 404 rather than 403: a user must not be able to probe which
    // account IDs exist for other users.
    if (!account) {
      throw new NotFoundException("Account not found");
    }
    if (options.requireActive && !account.is_active) {
      throw new BadRequestException("Account is archived");
    }
    if (options.allowedTypes && !options.allowedTypes.includes(account.type)) {
      throw new BadRequestException(
        `Account type '${account.type}' is not valid for this operation`,
      );
    }
    return account;
  }

  async requireAssetAccount(userId: string, accountId: string, options: AccountLookupOptions = {}) {
    const account = await this.requireAccount(userId, accountId, options);
    if (!isAssetAccount(account.type)) {
      throw new BadRequestException("A credit card account is not valid for this operation");
    }
    return account;
  }

  async requireCreditCardAccount(userId: string, accountId: string) {
    const account = await this.requireAccount(userId, accountId, {
      requireActive: true,
      allowedTypes: ["credit_card"],
    });
    const details = await this.prisma.credit_card_details.findFirst({
      where: { account_id: account.id, user_id: userId },
    });
    if (!details) {
      throw new NotFoundException("Credit card details not found");
    }
    return { account, details };
  }

  async requirePaymentAccount(userId: string, accountId: string, creditCardAccountId?: string) {
    const account = await this.requireAccount(userId, accountId, { requireActive: true });
    if (!isAssetAccount(account.type)) {
      throw new BadRequestException("The payment account must be a cash, bank or savings account");
    }
    if (creditCardAccountId && account.id === creditCardAccountId) {
      throw new BadRequestException("A credit card cannot be its own payment account");
    }
    return account;
  }

  /**
   * Categories may be global (user_id IS NULL) or owned by the user. Another
   * user's private category is treated as non-existent.
   */
  async requireCategory(userId: string, categoryId: string, expectedType?: category_type) {
    const category = await this.prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [{ user_id: userId }, { user_id: null }],
      },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }
    if (expectedType && category.type !== expectedType) {
      throw new BadRequestException(
        `Category '${category.name}' is a ${category.type} category, expected ${expectedType}`,
      );
    }
    return category;
  }

  async requireTransaction(userId: string, transactionId: string): Promise<transactions> {
    const transaction = await this.prisma.transactions.findFirst({
      where: { id: transactionId, user_id: userId },
    });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }

  async requireTransfer(userId: string, transactionId: string) {
    const transfer = await this.prisma.transfers.findFirst({
      where: { transaction_id: transactionId, user_id: userId },
      include: {
        transactions: true,
        accounts_transfers_from_account_id_user_idToaccounts: true,
        accounts_transfers_to_account_id_user_idToaccounts: true,
      },
    });
    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }
    return transfer;
  }

  async requireDebitCard(userId: string, cardId: string) {
    const card = await this.prisma.debit_cards.findFirst({
      where: {
        id: cardId,
        accounts: { user_id: userId },
      },
      include: { accounts: true },
    });
    if (!card) {
      throw new NotFoundException("Debit card not found");
    }
    return card;
  }
}
