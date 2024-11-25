import { Module } from '@nestjs/common'
import { SpecialsService } from './specials.service'
import { EntryService } from '@/entries/entries.service'
import { ExitService } from '@/exits/exits.service'
import { SpecialsController } from './specials.controller'
import { PrismaService } from '@/prisma.service'

@Module({
  providers: [SpecialsService, EntryService, ExitService, PrismaService],
  controllers: [SpecialsController]
})
export class SpecialsModule {}
