import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { dec } from "@/common/money";
import { LedgerService, REVERSAL_PREFIX } from "@/ledger/ledger.service";
import { isLiabilityAccount, movementForTransfer } from "@/ledger/ledger-rules";
import { TransactionsService } from "@/transactions/transactions.service";
import {
  CreateTransferDto,
  DeleteTransferDto,
  GetTransfersDto,
  ReverseTransferDto,
  UpdateTransferDto,
} from "./transfers.dto";

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionsService,
  ) {}

  async create(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException("Transfer source and destination must be different accounts");
    }

    const amount = dec(dto.amount);
    const fee = dec(dto.fee ?? "0");
    if (!amount.gt(0)) throw new BadRequestException("Transfer amount must be greater than zero");
    if (fee.lt(0)) throw new BadRequestException("Transfer fee cannot be negative");

    const created = await this.prisma.$transaction(async (tx) => {
      const accounts = await tx.accounts.findMany({
        where: {
          id: { in: [dto.fromAccountId, dto.toAccountId] },
          user_id: userId,
        },
      });

      const from = accounts.find((account) => account.id === dto.fromAccountId);
      const to = accounts.find((account) => account.id === dto.toAccountId);
      if (!from || !to) {
        throw new NotFoundException("Account not found");
      }
      if (!from.is_active || !to.is_active) {
        throw new BadRequestException("Both transfer accounts must be active");
      }
      if (isLiabilityAccount(from.type)) {
        throw new BadRequestException(
          "Credit card accounts cannot be the source of a transfer; create a cash advance adjustment instead",
        );
      }

      const transaction = await this.ledger.createInTransaction(
        tx,
        userId,
        {
          type: "transfer",
          amount,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          description: dto.description?.trim() || null,
          categoryId: null,
        },
        [
          {
            accountId: from.id,
            amount: movementForTransfer(from.type, "from", amount, fee),
          },
          {
            accountId: to.id,
            amount: movementForTransfer(to.type, "to", amount),
          },
        ],
      );

      await tx.transfers.create({
        data: {
          transaction_id: transaction.id,
          from_account_id: from.id,
          to_account_id: to.id,
          fee,
          user_id: userId,
        },
      });

      return transaction;
    });

    return this.getById(userId, created.id);
  }

  async list(userId: string, dto: GetTransfersDto) {
    return this.transactions.list(userId, {
      page: dto.page,
      pageSize: dto.pageSize,
      from: dto.from,
      to: dto.to,
      type: "transfer",
      accountId: dto.accountId,
      sortOrder: dto.sortOrder,
      includeReversed: true,
    });
  }

  async getById(userId: string, transactionId: string) {
    await this.requireTransfer(userId, transactionId);
    return this.transactions.getById(userId, transactionId);
  }

  async update(userId: string, transactionId: string, dto: UpdateTransferDto) {
    await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transfers.findFirst({
        where: { transaction_id: transactionId, user_id: userId },
        include: {
          transactions: { include: { account_movements: true } },
        },
      });
      if (!transfer) throw new NotFoundException("Transfer not found");

      const reversal = await tx.transactions.findFirst({
        where: {
          user_id: userId,
          type: "adjustment",
          description: { startsWith: `${REVERSAL_PREFIX}${transactionId}` },
        },
      });
      if (reversal) {
        throw new BadRequestException("Reversed transfers cannot be edited");
      }

      const accounts = await tx.accounts.findMany({
        where: {
          id: { in: [transfer.from_account_id, transfer.to_account_id] },
          user_id: userId,
        },
      });
      const from = accounts.find((account) => account.id === transfer.from_account_id);
      const to = accounts.find((account) => account.id === transfer.to_account_id);
      if (!from || !to) throw new NotFoundException("Account not found");

      const amount = dto.amount !== undefined ? dec(dto.amount) : transfer.transactions.amount;
      const fee = dto.fee !== undefined ? dec(dto.fee) : transfer.fee;
      if (!amount.gt(0)) throw new BadRequestException("Transfer amount must be greater than zero");
      if (fee.lt(0)) throw new BadRequestException("Transfer fee cannot be negative");

      await this.ledger.replaceMovementsInTransaction(tx, userId, transactionId, [
        {
          accountId: from.id,
          amount: movementForTransfer(from.type, "from", amount, fee),
        },
        {
          accountId: to.id,
          amount: movementForTransfer(to.type, "to", amount),
        },
      ]);

      await tx.transactions.update({
        where: { id: transactionId },
        data: {
          amount,
          ...(dto.occurredAt ? { occurred_at: new Date(dto.occurredAt) } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
        },
      });

      await tx.transfers.update({
        where: { transaction_id_user_id: { transaction_id: transactionId, user_id: userId } },
        data: { fee },
      });
    });

    return this.getById(userId, transactionId);
  }

  async remove(userId: string, transactionId: string, dto: DeleteTransferDto) {
    await this.requireTransfer(userId, transactionId);
    if (dto.hard) {
      return this.ledger.hardDeleteTransaction(userId, transactionId);
    }
    const reversal = await this.ledger.reverseTransaction(userId, transactionId);
    return this.transactions.getById(userId, reversal.id);
  }

  async reverse(userId: string, transactionId: string, dto: ReverseTransferDto) {
    await this.requireTransfer(userId, transactionId);
    const reversal = await this.ledger.reverseTransaction(
      userId,
      transactionId,
      dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    );
    return this.transactions.getById(userId, reversal.id);
  }

  async getMovements(userId: string, transactionId: string) {
    await this.requireTransfer(userId, transactionId);
    const transaction = await this.transactions.getById(userId, transactionId);
    return transaction.movements;
  }

  private async requireTransfer(userId: string, transactionId: string) {
    const transfer = await this.prisma.transfers.findFirst({
      where: { transaction_id: transactionId, user_id: userId },
    });
    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
  }
}
