import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { dec, money } from "@/common/money";
import { BalancesService } from "@/ledger/balances.service";
import { OwnershipService } from "@/ledger/ownership.service";
import { CreateAccountDto, GetAccountHistoryDto, UpdateAccountDto } from "./accounts.dto";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly balances: BalancesService,
  ) {}

  async getAccounts(userId: string, includeArchived = false, asOf?: string) {
    const rows = await this.balances.getBalances(
      userId,
      asOf ? new Date(asOf) : new Date(),
      includeArchived,
    );
    return rows.map((row) => this.serializeBalance(row));
  }

  async getAccount(userId: string, accountId: string, asOf?: string) {
    const row = await this.balances.getBalance(
      userId,
      accountId,
      asOf ? new Date(asOf) : new Date(),
    );
    return this.serializeBalance(row);
  }

  async createAccount(userId: string, dto: CreateAccountDto) {
    if (dto.type === "credit_card") {
      throw new BadRequestException(
        "Create credit card accounts through POST /credit-cards so card metadata is stored",
      );
    }

    const openingBalance = dec(dto.openingBalance ?? "0");
    if (openingBalance.lt(0)) {
      throw new BadRequestException("Opening balance cannot be negative");
    }

    const account = await this.prisma.accounts.create({
      data: {
        user_id: userId,
        name: dto.name.trim(),
        type: dto.type ?? "bank",
        opening_balance: openingBalance,
        opening_balance_date: dto.openingBalanceDate
          ? new Date(dto.openingBalanceDate)
          : new Date(),
      },
    });

    return this.getAccount(userId, account.id);
  }

  async updateAccount(userId: string, accountId: string, dto: UpdateAccountDto) {
    const account = await this.ownership.requireAccount(userId, accountId);

    if (dto.openingBalance !== undefined && dec(dto.openingBalance).lt(0)) {
      throw new BadRequestException("Opening balance cannot be negative");
    }

    await this.prisma.accounts.update({
      where: { id: account.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.openingBalance !== undefined ? { opening_balance: dec(dto.openingBalance) } : {}),
        ...(dto.openingBalanceDate !== undefined
          ? { opening_balance_date: new Date(dto.openingBalanceDate) }
          : {}),
        ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
      },
    });

    return this.getAccount(userId, account.id);
  }

  async archiveAccount(userId: string, accountId: string) {
    const account = await this.ownership.requireAccount(userId, accountId);
    await this.prisma.accounts.update({
      where: { id: account.id },
      data: { is_active: false },
    });
    return { archived: true, id: account.id };
  }

  async deleteAccount(userId: string, accountId: string, hard = false) {
    const account = await this.ownership.requireAccount(userId, accountId);

    if (!hard) {
      return this.archiveAccount(userId, account.id);
    }

    const [movements, debitCards, creditDetails, transfers] = await Promise.all([
      this.prisma.account_movements.count({ where: { account_id: account.id, user_id: userId } }),
      this.prisma.debit_cards.count({ where: { account_id: account.id } }),
      this.prisma.credit_card_details.count({
        where: { account_id: account.id, user_id: userId },
      }),
      this.prisma.transfers.count({
        where: {
          user_id: userId,
          OR: [{ from_account_id: account.id }, { to_account_id: account.id }],
        },
      }),
    ]);

    if (movements || debitCards || creditDetails || transfers) {
      throw new BadRequestException(
        "Account has financial history or linked cards and cannot be hard-deleted; archive it instead",
      );
    }

    await this.prisma.accounts.delete({ where: { id: account.id } });
    return { deleted: true, id: account.id };
  }

  /** Used by legacy entry/exit adapters and convenience flows. */
  async getOrCreateDefaultAccount(userId: string) {
    const existing = await this.prisma.accounts.findFirst({
      where: { user_id: userId, is_active: true, type: { not: "credit_card" } },
      orderBy: { name: "asc" },
    });

    if (existing) return existing;

    return this.prisma.accounts.create({
      data: {
        user_id: userId,
        name: "Main Account",
        type: "bank",
        opening_balance: dec(0),
        opening_balance_date: new Date(),
      },
    });
  }

  async getHistory(userId: string, accountId: string, dto: GetAccountHistoryDto) {
    const from = dto.from ? new Date(dto.from) : new Date("1970-01-01T00:00:00.000Z");
    const to = dto.to ? new Date(dto.to) : new Date();

    return this.balances.getHistory(userId, accountId, from, to, dto.page, dto.pageSize);
  }

  async getDailyBalances(userId: string, accountId: string, from: string, to: string) {
    if (new Date(from) > new Date(to)) {
      throw new BadRequestException("'from' must be before or equal to 'to'");
    }
    return this.balances.getDailyBalances(userId, accountId, from.slice(0, 10), to.slice(0, 10));
  }

  private serializeBalance(row: {
    id: string;
    name: string;
    type: string;
    opening_balance: string;
    opening_balance_date: Date;
    is_active: boolean;
    movements_total: string;
    balance: string;
  }) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      openingBalance: money(row.opening_balance),
      openingBalanceDate: row.opening_balance_date,
      isActive: row.is_active,
      movementsTotal: money(row.movements_total),
      balance: money(row.balance),
      // Credit card debt is represented by the signed ledger balance. For
      // credit cards, `balance` is the outstanding debt (positive = owed).
      outstandingDebt: row.type === "credit_card" ? money(row.balance) : null,
    };
  }

  /** Kept for legacy code paths that expected a NotFoundException. */
  async requireOwnedAccount(userId: string, accountId: string) {
    const account = await this.prisma.accounts.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!account) throw new NotFoundException("Account not found");
    return account;
  }
}
