import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common'
import { AllExceptionsFilter } from '@/middlewares/errors'
import { CreateUserDto } from '@/users/users.dto'
import { UsersService } from '@/users/users.service'
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto } from './exits.dto'
import { ExitService } from './exits.service'

@Controller('api/exits')
@UseFilters(AllExceptionsFilter)
export class ExitController {
  constructor(
    private readonly exitService: ExitService,
    private readonly usersService: UsersService
  ) { }

  @Post('new-exit')
  async newExpense(@Body() createExpenseDto: CreateExpenseDto) {
    const createUserDto: CreateUserDto = {
      email: createExpenseDto.email,
      fullName: createExpenseDto.fullName
    }
    await this.usersService.createUser(createUserDto)
    return this.exitService.newExpense(createExpenseDto)
  }

  @Get('get-exits')
  async getExits(@Query() getExitsDto: GetExitsDto) {
    const exits = await this.exitService.getExits(getExitsDto)
    return exits
  }

  @Get('get-exits-by-category-monthly')
  async getExpensesByCategoryMonthly(@Query() monthlyExitDto: MonthlyExitDto) {
    const exits = await this.exitService.getExpensesByCategoryMonthly(monthlyExitDto)
    return exits
  }
}
