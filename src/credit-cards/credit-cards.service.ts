import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { dec, money, ZERO } from "@/common/money";
import { BalancesService } from "@/ledger/balances.service";
import { computeAvailableCredit } from "@/ledger/ledger-rules";
import { OwnershipService } from "@/ledger/ownership.service";
import { TransfersService } from "@/transfers/transfers.service";
import {
  CreateCreditCardDto,
  CreditCardPaymentDto,
  GetCreditCardsDto,
  UpdateCreditCardDto,
} from "./credit-cards.dto";

@Injectable()
export class CreditCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly balances: BalancesService,
    private readonly transfers: TransfersService,
  ) {}

  async create(userId: string, dto: CreateCreditCardDto) {
    const openingBalance = dec(dto.openingBalance ?? "0");
    if (openingBalance.lt(0)) {
      throw new BadRequestException("Opening debt cannot be negative");
    }

    const account = await this.prisma.$transaction(async (tx) => {
      if (dto.paymentAccountId) {
        const paymentAccount = await tx.accounts.findFirst({
          where: { id: dto.paymentAccountId, user_id: userId },
        });
        if (!paymentAccount) throw new NotFoundException("Payment account not found");
        if (paymentAccount.type === "credit_card") {
          throw new BadRequestException(
            "A credit card cannot use another credit card as payment account",
          );
        }
        if (!paymentAccount.is_active) {
          throw new BadRequestException("Payment account is archived");
        }
      }

      const created = await tx.accounts.create({
        data: {
          user_id: userId,
          name: dto.name.trim(),
          type: "credit_card",
          opening_balance: openingBalance,
          opening_balance_date: dto.openingBalanceDate
            ? new Date(dto.openingBalanceDate)
            : new Date(),
        },
      });

      await tx.credit_card_details.create({
        data: {
          account_id: created.id,
          user_id: userId,
          last4: dto.last4 ?? null,
          credit_limit: dec(dto.creditLimit),
          statement_day: dto.statementDay,
          due_day: dto.dueDay,
          payment_account_id: dto.paymentAccountId ?? null,
        },
      });

      return created;
    });

    return this.getById(userId, account.id);
  }

  async list(userId: string, dto: GetCreditCardsDto) {
    const details = await this.prisma.credit_card_details.findMany({
      where: { user_id: userId },
      include: {
        accounts_credit_card_details_account_id_user_idToaccounts: true,
        accounts_credit_card_details_payment_account_id_user_idToaccounts: true,
      },
    });

    const balances = await this.balances.getBalances(userId, new Date(), true);
    const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));

    return details
      .filter((detail) => {
        const account = detail.accounts_credit_card_details_account_id_user_idToaccounts;
        return dto.includeArchived || account?.is_active;
      })
      .map((detail) => this.serialize(detail, balanceMap.get(detail.account_id)));
  }

  async getById(userId: string, accountId: string) {
    const detail = await this.prisma.credit_card_details.findFirst({
      where: { account_id: accountId, user_id: userId },
      include: {
        accounts_credit_card_details_account_id_user_idToaccounts: true,
        accounts_credit_card_details_payment_account_id_user_idToaccounts: true,
      },
    });
    if (!detail) throw new NotFoundException("Credit card not found");

    const balance = await this.balances.getBalance(userId, accountId);
    return this.serialize(detail, balance);
  }

  async update(userId: string, accountId: string, dto: UpdateCreditCardDto) {
    await this.prisma.$transaction(async (tx) => {
      const detail = await tx.credit_card_details.findFirst({
        where: { account_id: accountId, user_id: userId },
        include: { accounts_credit_card_details_account_id_user_idToaccounts: true },
      });
      if (!detail) throw new NotFoundException("Credit card not found");

      if (dto.paymentAccountId !== undefined && dto.paymentAccountId !== null) {
        const paymentAccount = await tx.accounts.findFirst({
          where: { id: dto.paymentAccountId, user_id: userId },
        });
        if (!paymentAccount) throw new NotFoundException("Payment account not found");
        if (paymentAccount.type === "credit_card") {
          throw new BadRequestException(
            "A credit card cannot use another credit card as payment account",
          );
        }
        if (!paymentAccount.is_active) {
          throw new BadRequestException("Payment account is archived");
        }
      }

      if (dto.openingBalance !== undefined && dec(dto.openingBalance).lt(0)) {
        throw new BadRequestException("Opening debt cannot be negative");
      }

      await tx.credit_card_details.update({
        where: { account_id_user_id: { account_id: accountId, user_id: userId } },
        data: {
          ...(dto.creditLimit !== undefined ? { credit_limit: dec(dto.creditLimit) } : {}),
          ...(dto.statementDay !== undefined ? { statement_day: dto.statementDay } : {}),
          ...(dto.dueDay !== undefined ? { due_day: dto.dueDay } : {}),
          ...(dto.last4 !== undefined ? { last4: dto.last4 } : {}),
          ...(dto.paymentAccountId !== undefined
            ? { payment_account_id: dto.paymentAccountId }
            : {}),
        },
      });

      await tx.accounts.update({
        where: { id: accountId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.openingBalance !== undefined ? { opening_balance: dec(dto.openingBalance) } : {}),
          ...(dto.openingBalanceDate !== undefined
            ? { opening_balance_date: new Date(dto.openingBalanceDate) }
            : {}),
        },
      });
    });

    return this.getById(userId, accountId);
  }

  async remove(userId: string, accountId: string, hard = false) {
    const account = await this.ownership.requireAccount(userId, accountId, {
      allowedTypes: ["credit_card"],
    });

    if (!hard) {
      await this.prisma.accounts.update({
        where: { id: account.id },
        data: { is_active: false },
      });
      return { archived: true, id: account.id };
    }

    const [movements, transfers, dependentCards] = await Promise.all([
      this.prisma.account_movements.count({ where: { account_id: account.id, user_id: userId } }),
      this.prisma.transfers.count({
        where: {
          user_id: userId,
          OR: [{ from_account_id: account.id }, { to_account_id: account.id }],
        },
      }),
      this.prisma.credit_card_details.count({
        where: { payment_account_id: account.id, user_id: userId },
      }),
    ]);

    if (movements || transfers || dependentCards) {
      throw new BadRequestException(
        "Credit card has ledger history or is used as a payment account; archive it instead",
      );
    }

    await this.prisma.accounts.delete({ where: { id: account.id } });
    return { deleted: true, id: account.id };
  }

  async pay(userId: string, accountId: string, dto: CreditCardPaymentDto) {
    await this.getById(userId, accountId);
    return this.transfers.create(userId, {
      fromAccountId: dto.fromAccountId,
      toAccountId: accountId,
      amount: dto.amount,
      fee: dto.fee ?? "0",
      occurredAt: dto.occurredAt,
      description: dto.description ?? "Credit card payment",
    });
  }

  async getPurchasesRange(userId: string, accountId?: string) {
    if (accountId) {
      await this.getById(userId, accountId);
    }

    const details = await this.prisma.credit_card_details.findMany({
      where: {
        user_id: userId,
        ...(accountId ? { account_id: accountId } : {}),
      },
      include: {
        accounts_credit_card_details_account_id_user_idToaccounts: true,
      },
    });

    if (!details.length) return [];

    const balances = await this.balances.getBalances(userId, new Date(), true);
    const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));
    const now = new Date();

    const daysInMonth = (year: number, month: number): number =>
      new Date(year, month + 1, 0).getDate();
    const cutOffIn = (year: number, month: number, day: number): Date =>
      new Date(year, month, Math.min(day, daysInMonth(year, month)), 23, 59, 59, 999);
    const startOfNextDay = (date: Date): Date =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const dueDateFor = (cutOff: Date, dueDay: number): Date => {
      const sameMonth = new Date(
        cutOff.getFullYear(),
        cutOff.getMonth(),
        Math.min(dueDay, daysInMonth(cutOff.getFullYear(), cutOff.getMonth())),
      );
      if (sameMonth > cutOff) return sameMonth;
      return new Date(
        cutOff.getFullYear(),
        cutOff.getMonth() + 1,
        Math.min(dueDay, daysInMonth(cutOff.getFullYear(), cutOff.getMonth() + 1)),
      );
    };

    const cardCalculations = details.map((detail) => {
      const account = detail.accounts_credit_card_details_account_id_user_idToaccounts;
      const thisMonthCutOff = cutOffIn(now.getFullYear(), now.getMonth(), detail.statement_day);
      const previousMonthCutOff = cutOffIn(
        now.getFullYear(),
        now.getMonth() - 1,
        detail.statement_day,
      );
      const nextMonthCutOff = cutOffIn(now.getFullYear(), now.getMonth() + 1, detail.statement_day);
      const pastCutOff = now > thisMonthCutOff;
      const endDate = pastCutOff ? nextMonthCutOff : thisMonthCutOff;
      const startDate = startOfNextDay(pastCutOff ? thisMonthCutOff : previousMonthCutOff);

      return {
        detail,
        account,
        startDate,
        endDate,
        dueDate: dueDateFor(endDate, detail.due_day),
      };
    });

    const minStart = new Date(Math.min(...cardCalculations.map((c) => c.startDate.getTime())));
    const maxEnd = new Date(Math.max(...cardCalculations.map((c) => c.endDate.getTime())));

    const transactions = await this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        type: "expense",
        occurred_at: { gte: minStart, lte: maxEnd },
        account_movements: {
          some: {
            user_id: userId,
            account_id: {
              in: cardCalculations.map((c) => c.account.id),
            },
          },
        },
      },
      include: { account_movements: true },
    });

    const reversed = await this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        type: "adjustment",
        description: { startsWith: "reversal_of:" },
      },
      select: { description: true },
    });
    const reversedIds = new Set(
      reversed
        .map((row) => row.description)
        .filter((description): description is string => Boolean(description))
        .map((description) => description.slice("reversal_of:".length).split("|")[0].trim()),
    );

    const toIsoDate = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;

    return cardCalculations.map(({ detail, account, startDate, endDate, dueDate }) => {
      const accountIdValue = account.id;
      const totalSpent = transactions
        .filter((transaction) => !reversedIds.has(transaction.id))
        .filter(
          (transaction) =>
            transaction.occurred_at >= startDate && transaction.occurred_at <= endDate,
        )
        .filter((transaction) =>
          transaction.account_movements.some((movement) => movement.account_id === accountIdValue),
        )
        .reduce((sum, transaction) => sum.plus(transaction.amount), ZERO());

      const balance = balanceMap.get(accountIdValue);
      const outstandingDebt = dec(balance?.balance ?? "0");
      const availableCredit = computeAvailableCredit(detail.credit_limit, outstandingDebt);

      return {
        id: accountIdValue,
        name: account.name,
        statementDay: detail.statement_day,
        dueDay: detail.due_day,
        creditLimit: money(detail.credit_limit),
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        dueDate: toIsoDate(dueDate),
        totalSpent: money(totalSpent),
        outstandingDebt: money(outstandingDebt),
        availableCredit: money(availableCredit),
      };
    });
  }

  private serialize(
    detail: any,
    balance?: { balance: string; opening_balance: string; opening_balance_date: Date },
  ) {
    const account = detail.accounts_credit_card_details_account_id_user_idToaccounts;
    const paymentAccount = detail.accounts_credit_card_details_payment_account_id_user_idToaccounts;
    const outstandingDebt = dec(balance?.balance ?? "0");
    const availableCredit = computeAvailableCredit(detail.credit_limit, outstandingDebt);

    return {
      id: account?.id ?? detail.account_id,
      accountId: detail.account_id,
      name: account?.name ?? null,
      type: "credit_card",
      isActive: account?.is_active ?? false,
      last4: detail.last4,
      creditLimit: money(detail.credit_limit),
      statementDay: detail.statement_day,
      dueDay: detail.due_day,
      paymentAccountId: detail.payment_account_id,
      paymentAccount: paymentAccount
        ? { id: paymentAccount.id, name: paymentAccount.name, type: paymentAccount.type }
        : null,
      openingBalance: money(balance?.opening_balance ?? account?.opening_balance ?? "0"),
      openingBalanceDate: balance?.opening_balance_date ?? account?.opening_balance_date ?? null,
      outstandingDebt: money(outstandingDebt),
      availableCredit: money(availableCredit),
    };
  }
}
