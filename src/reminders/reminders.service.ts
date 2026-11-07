import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateReminderDto, UpdateReminderDto } from "./reminders.dto";

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async newReminder(userId: string, dto: CreateReminderDto) {
    const reminder = await this.prisma.reminders.create({
      data: {
        user_id: userId,
        title: dto.title,
        amount: dto.amount ?? null,
        due_at: new Date(dto.dueAt),
        recurrence: dto.recurrence ?? "none",
        status: dto.status ?? "pending",
      },
    });

    await this.cacheManager.del(`reminders_${userId}`);
    return reminder;
  }

  async getReminders(userId: string) {
    const cacheKey = `reminders_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const reminders = await this.prisma.reminders.findMany({
      where: { user_id: userId },
      orderBy: { due_at: "asc" },
    });

    await this.cacheManager.set(cacheKey, reminders, 60 * 1000);
    return reminders;
  }

  async getReminderById(userId: string, id: string) {
    const reminder = await this.prisma.reminders.findFirst({
      where: { id, user_id: userId },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }

    return reminder;
  }

  async updateReminder(userId: string, id: string, dto: UpdateReminderDto) {
    const existing = await this.prisma.reminders.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }

    const updated = await this.prisma.reminders.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.amount !== undefined && { amount: dto.amount ?? null }),
        ...(dto.dueAt && { due_at: new Date(dto.dueAt) }),
        ...(dto.recurrence !== undefined && { recurrence: dto.recurrence }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    await this.cacheManager.del(`reminders_${userId}`);
    return updated;
  }

  async deleteReminder(userId: string, id: string) {
    const existing = await this.prisma.reminders.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }

    await this.prisma.reminders.delete({ where: { id } });
    await this.cacheManager.del(`reminders_${userId}`);
    return { deleted: true };
  }
}
