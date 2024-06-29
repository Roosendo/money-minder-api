import { Controller, Post, Get, Delete, Body, Query, UseFilters, Patch } from '@nestjs/common'
import { SavingsService } from './savings.service'
import { CreateSavingDto, GetSavingsDto, DeleteSavingDto, UpdateSavingDto } from './savings.dto'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('api/savings')
@UseFilters(AllExceptionsFilter)
export class SavingsController {
  constructor(
    private readonly savingsService: SavingsService,
    private readonly usersService: UsersService
  ) {}

  @Post('new-saving')
  async newSaving(@Body() createSavingDto: CreateSavingDto) {
    const createUserDto: CreateUserDto = {
      email: createSavingDto.email,
      fullName: createSavingDto.fullName
    }
    await this.usersService.createUser(createUserDto)
    return this.savingsService.newSaving(createSavingDto)
  }

  @Get('get-savings')
  async getSavings(@Query() getSavingsDto: GetSavingsDto) {
    const savings = await this.savingsService.getSavings(getSavingsDto)
    return savings
  }

  @Delete('delete-saving')
  async deleteSaving(@Query() deleteSavingDto: DeleteSavingDto) {
    return this.savingsService.deleteSaving(deleteSavingDto)
  }

  @Patch('update-saving')
  async updateSaving(@Body() updateSavingDto: UpdateSavingDto) {
    return this.savingsService.updateSaving(updateSavingDto)
  }
}
