import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  CreateEntryDto,
  GetEntriesDto,
  MonthlyEntryDto,
  UpdateEntryDto,
  YearlyEntryDto,
} from "./entries.dto";
import { EntryService } from "./entries.service";

@Controller("entries")
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  async newEntry(@CurrentUser() user: users, @Body() createEntryDto: CreateEntryDto) {
    return this.entryService.newEntry(user.id, createEntryDto);
  }

  @Get()
  async getEntries(@CurrentUser() user: users, @Query() getEntriesDto: GetEntriesDto) {
    return this.entryService.getEntries(user.id, getEntriesDto);
  }

  @Get("summary/monthly")
  async getMonthlyBreakdown(@CurrentUser() user: users, @Query() monthlyEntryDto: MonthlyEntryDto) {
    return this.entryService.getMonthlyBreakdown(user.id, monthlyEntryDto);
  }

  @Get("summary/yearly")
  async getYearlySummary(@CurrentUser() user: users, @Query() yearlyEntryDto: YearlyEntryDto) {
    return this.entryService.getYearlySummary(user.id, yearlyEntryDto);
  }

  @Get(":id")
  async getEntryById(@CurrentUser() user: users, @Param("id") id: string) {
    return this.entryService.getEntryById(user.id, id);
  }

  @Patch(":id")
  async updateEntry(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    return this.entryService.updateEntry(user.id, id, updateEntryDto);
  }

  @Delete(":id")
  async deleteEntry(@CurrentUser() user: users, @Param("id") id: string) {
    return this.entryService.deleteEntry(user.id, id);
  }
}
