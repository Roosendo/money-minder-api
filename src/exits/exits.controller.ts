import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  CreateExitDto,
  GetExitsDto,
  MonthlyExitDto,
  UpdateExitDto,
  YearlyExitDto,
} from "./exits.dto";
import { ExitService } from "./exits.service";

@Controller("exits")
export class ExitController {
  constructor(private readonly exitService: ExitService) {}

  @Post()
  async newExit(@CurrentUser() user: users, @Body() createExitDto: CreateExitDto) {
    return this.exitService.newExit(user.id, createExitDto);
  }

  @Get()
  async getExits(@CurrentUser() user: users, @Query() getExitsDto: GetExitsDto) {
    return this.exitService.getExits(user.id, getExitsDto);
  }

  @Get("summary/monthly")
  async getMonthlyBreakdown(@CurrentUser() user: users, @Query() monthlyExitDto: MonthlyExitDto) {
    return this.exitService.getMonthlyBreakdown(user.id, monthlyExitDto);
  }

  // Yearly summary for exits requested by the user
  @Get("summary/yearly")
  async getYearlySummary(@CurrentUser() user: users, @Query() yearlyExitDto: YearlyExitDto) {
    return this.exitService.getYearlySummary(user.id, yearlyExitDto);
  }

  @Get(":id")
  async getExitById(@CurrentUser() user: users, @Param("id") id: string) {
    return this.exitService.getExitById(user.id, id);
  }

  @Patch(":id")
  async updateExit(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() updateExitDto: UpdateExitDto,
  ) {
    return this.exitService.updateExit(user.id, id, updateExitDto);
  }

  @Delete(":id")
  async deleteExit(@CurrentUser() user: users, @Param("id") id: string) {
    return this.exitService.deleteExit(user.id, id);
  }
}
