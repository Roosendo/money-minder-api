import { Module } from '@nestjs/common'
import { EntryService } from '@/entries/entries.service'
import { ExitService } from '@/exits/exits.service'
import { PrismaService } from '@/prisma.service'
import { SpecialsController } from './specials.controller'
import { SpecialsService } from './specials.service'

@Module({
  providers: [SpecialsService, EntryService, ExitService, PrismaService],
  controllers: [SpecialsController]
})
export class SpecialsModule { }
