import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateAccountDto, UpdateAccountDto } from "./accounts.dto";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getAccounts(userId: string) {
    const cacheKey = `accounts_list_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const accounts = await this.prisma.accounts.findMany({
      where: { user_id: userId },
      orderBy: { name: "asc" },
    });

    await this.cacheManager.set(cacheKey, accounts, 60 * 1000);
    return accounts;
  }

  async createAccount(userId: string, { name, openingBalance }: CreateAccountDto) {
    const account = await this.prisma.accounts.create({
      data: {
        user_id: userId,
        name: name.trim(),
        opening_balance: openingBalance ?? 0,
      },
    });

    await this.cacheManager.del(`accounts_list_${userId}`);
    return account;
  }

  async getOrCreateDefaultAccount(userId: string) {
    const existing = await this.prisma.accounts.findFirst({
      where: { user_id: userId },
    });

    if (existing) return existing;

    return this.createAccount(userId, {
      name: "Main Account",
      openingBalance: 0,
    });
  }

  async updateAccount(userId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.prisma.accounts.findFirst({
      where: { id, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const updated = await this.prisma.accounts.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.openingBalance !== undefined ? { opening_balance: dto.openingBalance } : {}),
      },
    });

    await this.cacheManager.del(`accounts_list_${userId}`);
    return updated;
  }

  async deleteAccount(userId: string, id: string) {
    const account = await this.prisma.accounts.findFirst({
      where: { id, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    await this.prisma.accounts.delete({ where: { id } });
    await this.cacheManager.del(`accounts_list_${userId}`);
    return { deleted: true };
  }
}
