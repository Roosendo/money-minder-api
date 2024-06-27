import { Controller, Post, Get, Delete, Body, Query, UseFilters, Patch } from '@nestjs/common'
import { SavingsService } from './savings.service'
import {
  CreateSavingDto,
  GetSavingsDto,
  DeleteSavingDto,
  UpdateSavingDto
} from './savings.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('savings')
@UseFilters(AllExceptionsFilter)
export class SavingsController {
  constructor (private readonly savingsService: SavingsService) { }

  @Post('new-saving')
  async newSaving (@Body() createSavingDto: CreateSavingDto) {
    return this.savingsService.newSaving(createSavingDto)
  }

  @Get('get-savings')
  async getSavings (@Query() getSavingsDto: GetSavingsDto) {
    const savings = await this.savingsService.getSavings(getSavingsDto)
    return savings
  }

  @Delete('delete-saving')
  async deleteSaving (@Body() deleteSavingDto: DeleteSavingDto) {
    return this.savingsService.deleteSaving(deleteSavingDto)
  }

  @Patch('update-saving')
  async updateSaving (@Body() updateSavingDto: UpdateSavingDto) {
    return this.savingsService.updateSaving(updateSavingDto)
  }
}
