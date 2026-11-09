import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, transaction_type } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { dec, money } from "@/common/money";
import { LedgerService, REVERSAL_PREFIX } from "@/ledger/ledger.service";
import { isLiabilityAccount, movementForTransaction } from "@/ledger/ledger-rules";
import {
  CreateTransactionDto,
  DeleteTransactionDto,
  GetTransactionsDto,
  ReverseTransactionDto,
  UpdateTransactionDto,
} from "./transactions.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.type === "adjustment" && !dto.direction) {
      throw new BadRequestException("Adjustment transactions require a direction");
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const account = await tx.accounts.findFirst({
        where: { id: dto.accountId, user_id: userId },
      });
      if (!account) throw new NotFoundException("Account not found");
      if (!account.is_active) throw new BadRequestException("Account is archived");

      let categoryId: string | null = null;
      if (dto.categoryId) {
        const expectedType = dto.type === "adjustment" ? undefined : dto.type;
        categoryId = await this.resolveCategoryId(tx, userId, dto.categoryId, expectedType);
      }
      if (dto.type === "adjustment" && categoryId) {
        throw new BadRequestException("Adjustment transactions cannot have a category");
      }

      const movementAmount = movementForTransaction(
        account.type,
        dto.type as transaction_type,
        dto.amount,
        dto.direction as "increase" | "decrease" | undefined,
      );

      return this.ledger.createInTransaction(
        tx,
        userId,
        {
          type: dto.type as transaction_type,
          amount: dto.amount,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          description: dto.description?.trim() || null,
          categoryId,
        },
        [{ accountId: account.id, amount: movementAmount }],
      );
    });

    return this.getById(userId, created.id);
  }

  async list(userId: string, dto: GetTransactionsDto) {
    const where: Prisma.transactionsWhereInput = {
      user_id: userId,
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.categoryId ? { category_id: dto.categoryId } : {}),
      ...(dto.accountId
        ? { account_movements: { some: { account_id: dto.accountId, user_id: userId } } }
        : {}),
      ...(dto.from || dto.to
        ? {
            occurred_at: {
              ...(dto.from ? { gte: new Date(dto.from) } : {}),
              ...(dto.to ? { lte: new Date(dto.to) } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.transactionsOrderByWithRelationInput[] = [
      { occurred_at: dto.sortOrder ?? "desc" },
      { created_at: dto.sortOrder ?? "desc" },
      { id: dto.sortOrder ?? "desc" },
    ];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transactions.findMany({
        where,
        orderBy,
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        include: this.transactionInclude(),
      }),
      this.prisma.transactions.count({ where }),
    ]);

    const reversed =
      dto.includeReversed === false ? null : await this.ledger.findReversedTransactionIds(userId);
    const serialized = items.map((transaction) => this.serialize(transaction, reversed));

    return {
      items:
        dto.includeReversed === false ? serialized.filter((item) => !item.reversed) : serialized,
      total,
      page: dto.page,
      pageSize: dto.pageSize,
      totalPages: Math.ceil(total / dto.pageSize) || 1,
    };
  }

  async getById(userId: string, transactionId: string) {
    const transaction = await this.ledger.findTransactionWithMovements(userId, transactionId);
    const reversal = await this.prisma.transactions.findFirst({
      where: {
        user_id: userId,
        type: "adjustment",
        description: { startsWith: `${REVERSAL_PREFIX}${transaction.id}` },
      },
      select: { id: true },
    });

    return this.serialize(transaction, reversal ? new Set([transaction.id]) : new Set());
  }

  async update(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.transactions.findFirst({
        where: { id: transactionId, user_id: userId },
        include: { account_movements: true },
      });
      if (!existing) throw new NotFoundException("Transaction not found");
      if (existing.type === "transfer") {
        throw new BadRequestException("Use PATCH /transfers/:transactionId to edit transfers");
      }
      if (!existing.account_movements.length) {
        throw new BadRequestException("Transaction has no movements");
      }

      const reversal = await tx.transactions.findFirst({
        where: {
          user_id: userId,
          type: "adjustment",
          description: { startsWith: `${REVERSAL_PREFIX}${existing.id}` },
        },
      });
      if (reversal) {
        throw new BadRequestException("Reversed transactions cannot be edited");
      }

      const currentMovement = existing.account_movements[0];
      const accountId = dto.accountId ?? currentMovement.account_id;

      const account = await tx.accounts.findFirst({
        where: { id: accountId, user_id: userId },
      });
      if (!account) throw new NotFoundException("Account not found");
      if (!account.is_active) throw new BadRequestException("Account is archived");

      const amount = dto.amount !== undefined ? dec(dto.amount) : existing.amount;
      if (!amount.gt(0)) {
        throw new BadRequestException("Transaction amount must be greater than zero");
      }

      let direction: "increase" | "decrease" | undefined;
      if (existing.type === "adjustment") {
        direction =
          (dto.direction as "increase" | "decrease" | undefined) ??
          (currentMovement.amount.gt(0) ? "increase" : "decrease");
      }

      let categoryId: string | null | undefined = dto.categoryId as string | null | undefined;
      if (categoryId === undefined) {
        categoryId = existing.category_id;
      } else if (categoryId !== null) {
        categoryId = await this.resolveCategoryId(tx, userId, categoryId, existing.type);
      }
      if (existing.type === "adjustment" && categoryId) {
        throw new BadRequestException("Adjustment transactions cannot have a category");
      }

      const movementAmount = movementForTransaction(account.type, existing.type, amount, direction);

      await this.ledger.replaceMovementsInTransaction(tx, userId, existing.id, [
        { accountId: account.id, amount: movementAmount },
      ]);

      return tx.transactions.update({
        where: { id: existing.id },
        data: {
          amount,
          ...(dto.occurredAt ? { occurred_at: new Date(dto.occurredAt) } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          category_id: categoryId ?? null,
        },
        include: this.transactionInclude(),
      });
    });

    return this.serialize(updated, new Set());
  }

  async remove(userId: string, transactionId: string, dto: DeleteTransactionDto) {
    if (dto.hard) {
      return this.ledger.hardDeleteTransaction(userId, transactionId);
    }
    const reversal = await this.ledger.reverseTransaction(userId, transactionId);
    return this.getById(userId, reversal.id);
  }

  async reverse(userId: string, transactionId: string, dto: ReverseTransactionDto) {
    const reversal = await this.ledger.reverseTransaction(
      userId,
      transactionId,
      dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    );
    return this.getById(userId, reversal.id);
  }

  private async resolveCategoryId(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId: string,
    expectedType?: transaction_type,
  ): Promise<string> {
    const category = await tx.categories.findFirst({
      where: {
        id: categoryId,
        OR: [{ user_id: userId }, { user_id: null }],
      },
    });
    if (!category) throw new NotFoundException("Category not found");

    if (expectedType && expectedType !== "adjustment" && category.type !== expectedType) {
      throw new BadRequestException(
        `Category '${category.name}' is a ${category.type} category, expected ${expectedType}`,
      );
    }
    return category.id;
  }

  private transactionInclude(): Prisma.transactionsInclude {
    return {
      account_movements: {
        include: {
          accounts: {
            select: { id: true, name: true, type: true, is_active: true },
          },
        },
        orderBy: { created_at: "asc" },
      },
      categories: { select: { id: true, name: true, type: true } },
      transfers: true,
    };
  }

  private serialize(transaction: any, reversedIds: Set<string> | null) {
    const description: string | null = transaction.description;
    const reversalOf =
      description && description.startsWith(REVERSAL_PREFIX)
        ? description.slice(REVERSAL_PREFIX.length).split("|")[0].trim()
        : null;

    return {
      id: transaction.id,
      type: transaction.type,
      amount: money(transaction.amount),
      description,
      occurredAt: transaction.occurred_at,
      createdAt: transaction.created_at,
      category: transaction.categories
        ? {
            id: transaction.categories.id,
            name: transaction.categories.name,
            type: transaction.categories.type,
          }
        : null,
      movements: (transaction.account_movements ?? []).map((movement: any) => ({
        id: movement.id,
        accountId: movement.account_id,
        amount: money(movement.amount),
        account: movement.accounts
          ? {
              id: movement.accounts.id,
              name: movement.accounts.name,
              type: movement.accounts.type,
              isActive: movement.accounts.is_active,
            }
          : null,
      })),
      transfer: transaction.transfers
        ? {
            transactionId: transaction.transfers.transaction_id,
            fromAccountId: transaction.transfers.from_account_id,
            toAccountId: transaction.transfers.to_account_id,
            fee: money(transaction.transfers.fee),
          }
        : null,
      reversed: reversedIds ? reversedIds.has(transaction.id) : false,
      reversalOf,
      // For credit card accounts, movements are liability deltas. Consumers can
      // resolve the account type from the movement's account object.
      affectsLiability: (transaction.account_movements ?? []).some((movement: any) =>
        movement.accounts ? isLiabilityAccount(movement.accounts.type) : false,
      ),
    };
  }
}
