import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { CreateReminderDto, UpdateReminderDto } from "./reminders.dto";
import { RemindersService } from "./reminders.service";

@Controller("reminders")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async newReminder(@CurrentUser() user: users, @Body() createReminderDto: CreateReminderDto) {
    return this.remindersService.newReminder(user.id, createReminderDto);
  }

  @Get()
  async getReminders(@CurrentUser() user: users) {
    return this.remindersService.getReminders(user.id);
  }

  @Get(":id")
  async getReminder(@CurrentUser() user: users, @Param("id") id: string) {
    return this.remindersService.getReminderById(user.id, id);
  }

  @Patch(":id")
  async updateReminder(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.updateReminder(user.id, id, updateReminderDto);
  }

  @Delete(":id")
  async deleteReminder(@CurrentUser() user: users, @Param("id") id: string) {
    return this.remindersService.deleteReminder(user.id, id);
  }
}
