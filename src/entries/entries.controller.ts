import { Controller, Post, Get, Body, Query, UseFilters } from '@nestjs/common'
import { EntryService } from './entries.service'
import { CreateEntryDto, GetEntriesDto } from './entries.dto'

@Controller('entries')
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
}
