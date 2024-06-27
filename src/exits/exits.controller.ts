import { Controller, Post, Get, Body, Query, UseFilters } from '@nestjs/common'
import { ExitService } from './exits.service'
import {
  CreateExpenseDto,
  GetExitsDto,
  MonthlyExitDto
} from './exits.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('exits')
@UseFilters(AllExceptionsFilter)
export class ExitController {
  constructor (private readonly exitService: ExitService) { }

  @Post('new-exit')
  async newExpense (@Body() createExpenseDto: CreateExpenseDto) {
    return this.exitService.newExpense(createExpenseDto)
  }

  @Get('get-exits')
  async getExits (@Query() getExitsDto: GetExitsDto) {
    const exits = await this.exitService.getExits(getExitsDto)
    return exits
  }

  @Get('get-exits-by-category-monthly')
  async getExpensesByCategoryMonthly (@Query() monthlyExitDto: MonthlyExitDto) {
    const exits = await this.exitService.getExpensesByCategoryMonthly(monthlyExitDto)
    return exits
  }
}
