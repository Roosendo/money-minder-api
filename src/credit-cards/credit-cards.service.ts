import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateCreditCardDto, EditCreditCardDto } from "./credit-cards.dto";

@Injectable()
export class CreditCardsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async newCreditCard(userId: string, dto: CreateCreditCardDto) {
    const card = await this.prisma.credit_cards.create({
      data: {
        user_id: userId,
        name: dto.name,
        last4: dto.last4,
        credit_limit: dto.creditLimit,
        statement_day: dto.statementDay,
        due_day: dto.dueDay,
      },
    });

    await this.cacheManager.del(`credit_cards_${userId}`);
    return card;
  }

  async getCreditCards(userId: string) {
    const cacheKey = `credit_cards_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const cards = await this.prisma.credit_cards.findMany({
      where: { user_id: userId },
      orderBy: { name: "asc" },
    });

    await this.cacheManager.set(cacheKey, cards, 60 * 1000);
    return cards;
  }

  async getCreditCardById(userId: string, creditCardId: string) {
    const card = await this.prisma.credit_cards.findFirst({
      where: { id: creditCardId, user_id: userId },
    });

    if (!card) {
      throw new NotFoundException(`Credit card ${creditCardId} not found`);
    }

    return card;
  }

  async editCreditCard(userId: string, creditCardId: string, dto: EditCreditCardDto) {
    const existing = await this.prisma.credit_cards.findFirst({
      where: { id: creditCardId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Credit card ${creditCardId} not found`);
    }

    const updated = await this.prisma.credit_cards.update({
      where: { id: creditCardId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.last4 !== undefined && { last4: dto.last4 }),
        ...(dto.creditLimit !== undefined && { credit_limit: dto.creditLimit }),
        ...(dto.statementDay !== undefined && { statement_day: dto.statementDay }),
        ...(dto.dueDay !== undefined && { due_day: dto.dueDay }),
      },
    });

    await this.cacheManager.del(`credit_cards_${userId}`);
    return updated;
  }

  async deleteCreditCard(userId: string, creditCardId: string) {
    const existing = await this.prisma.credit_cards.findFirst({
      where: { id: creditCardId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Credit card ${creditCardId} not found`);
    }

    await this.prisma.credit_cards.delete({
      where: { id: creditCardId },
    });

    await this.cacheManager.del(`credit_cards_${userId}`);
    return { deleted: true };
  }

  async getPurchasesRange(userId: string, creditCardId?: string) {
    const now = new Date();

    const cards = await this.prisma.credit_cards.findMany({
      where: {
        user_id: userId,
        ...(creditCardId ? { id: creditCardId } : {}),
      },
      select: {
        id: true,
        name: true,
        statement_day: true,
        due_day: true,
        credit_limit: true,
      },
    });

    if (!cards.length) {
      return [];
    }

    const daysInMonth = (year: number, month: number): number =>
      new Date(year, month + 1, 0).getDate();

    // Statement days above the length of the month fall back to the last day.
    const cutOffIn = (year: number, month: number, day: number): Date =>
      new Date(year, month, Math.min(day, daysInMonth(year, month)), 23, 59, 59, 999);

    const startOfNextDay = (date: Date): Date =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    // The payment is due on the first `due_day` after the statement closes.
    const dueDateFor = (cutOff: Date, dueDay: number): Date => {
      const sameMonth = new Date(
        cutOff.getFullYear(),
        cutOff.getMonth(),
        Math.min(dueDay, daysInMonth(cutOff.getFullYear(), cutOff.getMonth())),
      );

      if (sameMonth > cutOff) {
        return sameMonth;
      }

      return new Date(
        cutOff.getFullYear(),
        cutOff.getMonth() + 1,
        Math.min(dueDay, daysInMonth(cutOff.getFullYear(), cutOff.getMonth() + 1)),
      );
    };

    // Build ranges per card. The range is the currently open billing cycle: it
    // starts the day after the previous cut-off and ends on the next one.
    const cardCalculations = cards.map((card) => {
      const thisMonthCutOff = cutOffIn(now.getFullYear(), now.getMonth(), card.statement_day);
      const previousMonthCutOff = cutOffIn(
        now.getFullYear(),
        now.getMonth() - 1,
        card.statement_day,
      );
      const nextMonthCutOff = cutOffIn(now.getFullYear(), now.getMonth() + 1, card.statement_day);

      const pastCutOff = now > thisMonthCutOff;
      const endDate = pastCutOff ? nextMonthCutOff : thisMonthCutOff;
      const startDate = startOfNextDay(pastCutOff ? thisMonthCutOff : previousMonthCutOff);

      return {
        ...card,
        startDate,
        endDate,
        dueDate: dueDateFor(endDate, card.due_day),
      };
    });

    // Single query groupBy across all cards (eliminates N+1)
    const minStart = new Date(Math.min(...cardCalculations.map((c) => c.startDate.getTime())));
    const maxEnd = new Date(Math.max(...cardCalculations.map((c) => c.endDate.getTime())));

    const purchases = await this.prisma.exits.findMany({
      where: {
        user_id: userId,
        credit_card_id: { in: cards.map((c) => c.id) },
        date: { gte: minStart, lte: maxEnd },
      },
      select: {
        credit_card_id: true,
        amount: true,
        date: true,
      },
    });

    const toIsoDate = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;

    return cardCalculations.map((card) => {
      const cardPurchases = purchases.filter(
        (p) => p.credit_card_id === card.id && p.date >= card.startDate && p.date <= card.endDate,
      );

      const totalSpent = cardPurchases.reduce((acc, p) => acc + Number(p.amount), 0);

      return {
        id: card.id,
        name: card.name,
        statementDay: card.statement_day,
        dueDay: card.due_day,
        creditLimit: Number(card.credit_limit),
        startDate: toIsoDate(card.startDate),
        endDate: toIsoDate(card.endDate),
        dueDate: toIsoDate(card.dueDate),
        totalSpent,
        availableCredit: Math.max(0, Number(card.credit_limit) - totalSpent),
      };
    });
  }
}
