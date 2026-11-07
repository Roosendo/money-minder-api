import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateSavingDto, UpdateSavingDto } from "./savings.dto";

@Injectable()
export class SavingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async newSaving(userId: string, dto: CreateSavingDto) {
    const current = dto.currentAmount ?? 0;
    if (current > dto.targetAmount) {
      throw new BadRequestException("Current amount cannot exceed target amount");
    }

    const saving = await this.prisma.savings.create({
      data: {
        user_id: userId,
        name: dto.name,
        target_amount: dto.targetAmount,
        current_amount: current,
        target_date: dto.targetDate ? new Date(dto.targetDate) : null,
      },
    });

    await this.cacheManager.del(`savings_${userId}`);
    return saving;
  }

  async getSavings(userId: string) {
    const cacheKey = `savings_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const savings = await this.prisma.savings.findMany({
      where: { user_id: userId },
      orderBy: { name: "asc" },
    });

    await this.cacheManager.set(cacheKey, savings, 60 * 1000);
    return savings;
  }

  async getSavingById(userId: string, id: string) {
    const saving = await this.prisma.savings.findFirst({
      where: { id, user_id: userId },
    });

    if (!saving) {
      throw new NotFoundException(`Saving ${id} not found`);
    }

    return saving;
  }

  async updateSaving(userId: string, id: string, dto: UpdateSavingDto) {
    const existing = await this.prisma.savings.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Saving ${id} not found`);
    }

    const targetAmount = dto.targetAmount ?? Number(existing.target_amount);
    const currentAmount = dto.currentAmount ?? Number(existing.current_amount);

    if (currentAmount > targetAmount) {
      throw new BadRequestException("Current amount cannot exceed target amount");
    }

    const updated = await this.prisma.savings.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmount !== undefined && { target_amount: dto.targetAmount }),
        ...(dto.currentAmount !== undefined && { current_amount: dto.currentAmount }),
        ...(dto.targetDate !== undefined && {
          target_date: dto.targetDate ? new Date(dto.targetDate) : null,
        }),
      },
    });

    await this.cacheManager.del(`savings_${userId}`);
    return updated;
  }

  async deleteSaving(userId: string, id: string) {
    const existing = await this.prisma.savings.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Saving ${id} not found`);
    }

    await this.prisma.savings.delete({ where: { id } });
    await this.cacheManager.del(`savings_${userId}`);
    return { deleted: true };
  }
}
