import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { account_type, Prisma, transaction_type } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { dec, MoneyLike } from "@/common/money";

export interface MovementInput {
  accountId: string;
  amount: MoneyLike;
}

export interface CreateTransactionInput {
  type: transaction_type;
  amount: MoneyLike;
  occurredAt?: Date;
  description?: string | null;
  categoryId?: string | null;
}

export const REVERSAL_PREFIX = "reversal_of:";

type Tx = Prisma.TransactionClient | PrismaService;

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that every referenced account belongs to the authenticated user
   * and is still active. This runs inside the same DB transaction as the write.
   */
  async assertAccountsOwned(
    tx: Tx,
    userId: string,
    accountIds: string[],
    requireActive = true,
  ): Promise<Map<string, { id: string; type: account_type }>> {
    const uniqueIds = Array.from(new Set(accountIds));
    const accounts = await tx.accounts.findMany({
      where: { id: { in: uniqueIds }, user_id: userId },
      select: { id: true, type: true, is_active: true },
    });

    if (accounts.length !== uniqueIds.length) {
      throw new NotFoundException("Account not found");
    }

    const map = new Map(accounts.map((account) => [account.id, account]));
    if (requireActive) {
      for (const account of accounts) {
        if (!account.is_active) {
          throw new BadRequestException(`Account '${account.id}' is archived`);
        }
      }
    }
    return map;
  }

  async createInTransaction(
    tx: Tx,
    userId: string,
    input: CreateTransactionInput,
    movements: MovementInput[],
  ) {
    if (!movements.length) {
      throw new BadRequestException("A transaction must have at least one account movement");
    }

    const amount = dec(input.amount);
    if (!amount.gt(0)) {
      throw new BadRequestException("Transaction amount must be greater than zero");
    }

    for (const movement of movements) {
      if (dec(movement.amount).isZero()) {
        throw new BadRequestException("Account movements must not be zero");
      }
    }

    await this.assertAccountsOwned(
      tx,
      userId,
      movements.map((movement) => movement.accountId),
    );

    return tx.transactions.create({
      data: {
        user_id: userId,
        type: input.type,
        amount,
        occurred_at: input.occurredAt ?? new Date(),
        description: input.description ?? null,
        category_id: input.categoryId ?? null,
        account_movements: {
          create: movements.map((movement) => ({
            account_id: movement.accountId,
            amount: dec(movement.amount),
          })),
        },
      },
      include: {
        account_movements: true,
        transfers: true,
        categories: true,
      },
    });
  }

  async replaceMovementsInTransaction(
    tx: Tx,
    userId: string,
    transactionId: string,
    movements: MovementInput[],
  ) {
    if (!movements.length) {
      throw new BadRequestException("A transaction must have at least one account movement");
    }
    for (const movement of movements) {
      if (dec(movement.amount).isZero()) {
        throw new BadRequestException("Account movements must not be zero");
      }
    }

    await this.assertAccountsOwned(
      tx,
      userId,
      movements.map((movement) => movement.accountId),
    );

    await tx.account_movements.deleteMany({
      where: { transaction_id: transactionId, user_id: userId },
    });

    await tx.account_movements.createMany({
      data: movements.map((movement) => ({
        user_id: userId,
        transaction_id: transactionId,
        account_id: movement.accountId,
        amount: dec(movement.amount),
      })),
    });
  }

  /**
   * Creates a compensating adjustment transaction. The original ledger rows are
   * never deleted, so the audit trail remains intact. The reversal is dated at
   * the original occurrence by default so historical balances are corrected.
   */
  async reverseTransaction(userId: string, transactionId: string, occurredAt?: Date) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.transactions.findFirst({
        where: { id: transactionId, user_id: userId },
        include: { account_movements: true, transfers: true },
      });

      if (!original) {
        throw new NotFoundException("Transaction not found");
      }

      const existingReversal = await tx.transactions.findFirst({
        where: {
          user_id: userId,
          type: "adjustment",
          description: { startsWith: `${REVERSAL_PREFIX}${original.id}` },
        },
      });
      if (existingReversal) {
        throw new BadRequestException("Transaction has already been reversed");
      }

      if (!original.account_movements.length) {
        throw new BadRequestException("Transaction has no account movements to reverse");
      }

      return this.createInTransaction(
        tx,
        userId,
        {
          type: "adjustment",
          amount: original.amount,
          occurredAt: occurredAt ?? original.occurred_at,
          description: `${REVERSAL_PREFIX}${original.id}`,
          categoryId: null,
        },
        original.account_movements.map((movement) => ({
          accountId: movement.account_id,
          amount: movement.amount.negated(),
        })),
      );
    });
  }

  /**
   * Hard deletes are intentionally opt-in. They are only allowed when a
   * transaction is a true mistake and has not already been reversed.
   */
  async hardDeleteTransaction(userId: string, transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.transactions.findFirst({
        where: { id: transactionId, user_id: userId },
      });
      if (!original) {
        throw new NotFoundException("Transaction not found");
      }

      const existingReversal = await tx.transactions.findFirst({
        where: {
          user_id: userId,
          type: "adjustment",
          description: { startsWith: `${REVERSAL_PREFIX}${original.id}` },
        },
      });
      if (existingReversal) {
        throw new BadRequestException(
          "Reversed transactions cannot be hard-deleted; reverse the reversal instead",
        );
      }

      await tx.transactions.delete({ where: { id: transactionId } });
      return { deleted: true, transactionId };
    });
  }

  /** Accounts that have a reversal transaction referencing them. */
  async findReversedTransactionIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        type: "adjustment",
        description: { startsWith: REVERSAL_PREFIX },
      },
      select: { description: true },
    });

    return new Set(
      rows
        .map((row) => row.description)
        .filter((description): description is string => Boolean(description))
        .map((description) => description.slice(REVERSAL_PREFIX.length).split("|")[0].trim()),
    );
  }

  async findTransactionWithMovements(userId: string, transactionId: string) {
    const transaction = await this.prisma.transactions.findFirst({
      where: { id: transactionId, user_id: userId },
      include: {
        account_movements: {
          include: { accounts: true },
          orderBy: { created_at: "asc" },
        },
        categories: true,
        transfers: {
          include: {
            accounts_transfers_from_account_id_user_idToaccounts: true,
            accounts_transfers_to_account_id_user_idToaccounts: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }
}
