import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { OwnershipService } from "@/ledger/ownership.service";
import { CreateDebitCardDto, GetDebitCardsDto, UpdateDebitCardDto } from "./debit-cards.dto";

@Injectable()
export class DebitCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async create(userId: string, dto: CreateDebitCardDto) {
    const card = await this.prisma.$transaction(async (tx) => {
      const account = await tx.accounts.findFirst({
        where: { id: dto.accountId, user_id: userId },
      });
      if (!account) throw new NotFoundException("Account not found");
      if (account.type !== "bank") {
        throw new BadRequestException("Debit cards can only be linked to bank accounts");
      }
      if (!account.is_active) throw new BadRequestException("Account is archived");

      return tx.debit_cards.create({
        data: {
          account_id: account.id,
          name: dto.name.trim(),
          last4: dto.last4 ?? null,
        },
        include: { accounts: { select: { id: true, name: true, type: true } } },
      });
    });

    return this.serialize(card);
  }

  async list(userId: string, dto: GetDebitCardsDto) {
    if (dto.accountId) {
      await this.ownership.requireAccount(userId, dto.accountId);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.debit_cards.findMany({
        where: {
          accounts: { user_id: userId },
          ...(dto.accountId ? { account_id: dto.accountId } : {}),
        },
        include: { accounts: { select: { id: true, name: true, type: true } } },
        orderBy: { created_at: "desc" },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prisma.debit_cards.count({
        where: {
          accounts: { user_id: userId },
          ...(dto.accountId ? { account_id: dto.accountId } : {}),
        },
      }),
    ]);

    return {
      items: items.map((card) => this.serialize(card)),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
      totalPages: Math.ceil(total / dto.pageSize) || 1,
    };
  }

  async getById(userId: string, cardId: string) {
    const card = await this.ownership.requireDebitCard(userId, cardId);
    return this.serialize(card);
  }

  async update(userId: string, cardId: string, dto: UpdateDebitCardDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.debit_cards.findFirst({
        where: { id: cardId, accounts: { user_id: userId } },
      });
      if (!existing) throw new NotFoundException("Debit card not found");

      let accountId = existing.account_id;
      if (dto.accountId) {
        const account = await tx.accounts.findFirst({
          where: { id: dto.accountId, user_id: userId },
        });
        if (!account) throw new NotFoundException("Account not found");
        if (account.type !== "bank") {
          throw new BadRequestException("Debit cards can only be linked to bank accounts");
        }
        if (!account.is_active) throw new BadRequestException("Account is archived");
        accountId = account.id;
      }

      return tx.debit_cards.update({
        where: { id: cardId },
        data: {
          account_id: accountId,
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.last4 !== undefined ? { last4: dto.last4 } : {}),
        },
        include: { accounts: { select: { id: true, name: true, type: true } } },
      });
    });

    return this.serialize(updated);
  }

  async remove(userId: string, cardId: string) {
    await this.ownership.requireDebitCard(userId, cardId);
    await this.prisma.debit_cards.delete({ where: { id: cardId } });
    return { deleted: true, id: cardId };
  }

  private serialize(card: any) {
    return {
      id: card.id,
      name: card.name,
      last4: card.last4,
      createdAt: card.created_at,
      account: card.accounts
        ? {
            id: card.accounts.id,
            name: card.accounts.name,
            type: card.accounts.type,
          }
        : null,
      accountId: card.account_id,
    };
  }
}
