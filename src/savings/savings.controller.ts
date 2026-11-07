import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { CreateSavingDto, UpdateSavingDto } from "./savings.dto";
import { SavingsService } from "./savings.service";

@Controller("savings")
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  async newSaving(@CurrentUser() user: users, @Body() createSavingDto: CreateSavingDto) {
    return this.savingsService.newSaving(user.id, createSavingDto);
  }

  @Get()
  async getSavings(@CurrentUser() user: users) {
    return this.savingsService.getSavings(user.id);
  }

  @Get(":id")
  async getSaving(@CurrentUser() user: users, @Param("id") id: string) {
    return this.savingsService.getSavingById(user.id, id);
  }

  @Patch(":id")
  async updateSaving(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() updateSavingDto: UpdateSavingDto,
  ) {
    return this.savingsService.updateSaving(user.id, id, updateSavingDto);
  }

  @Delete(":id")
  async deleteSaving(@CurrentUser() user: users, @Param("id") id: string) {
    return this.savingsService.deleteSaving(user.id, id);
  }
}
