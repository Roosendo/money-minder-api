import { Controller, Post, Get, Body, Query, UseFilters } from '@nestjs/common'
import { EntryService } from './entries.service'
import {
  CreateEntryDto,
  GetEntriesDto,
  MonthlyEntryDto
} from './entries.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('entries')
@UseFilters(AllExceptionsFilter)
export class EntryController {
  constructor (private readonly entryService: EntryService) { }

  @Post('new-entry')
  async newEntry (@Body() createEntryDto: CreateEntryDto) {
    return this.entryService.newEntry(createEntryDto)
  }

  @Get('get-entries')
  async getEntries (@Query() getEntriesDto: GetEntriesDto) {
    const entries = await this.entryService.getEntries(getEntriesDto)
    return entries
  }

  @Get('get-entries-by-category-monthly')
  async getEntriesByCategoryMonthly (@Query() monthlyEntryDto: MonthlyEntryDto) {
    const entries = await this.entryService.getEntriesByCategoryMonthly(monthlyEntryDto)
    return entries
  }
}
