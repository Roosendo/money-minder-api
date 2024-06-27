import { Module } from '@nestjs/common'
import { SpecialsService } from './specials.service'
import { EntryService } from '@/entries/entries.service'
import { ExitService } from '@/exits/exits.service'
import { SpecialsController } from './specials.controller'
import { DatabaseModule } from '@/config/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [SpecialsService, EntryService, ExitService],
  controllers: [SpecialsController]
})
export class SpecialsModule { }
