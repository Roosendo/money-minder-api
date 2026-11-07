import { Module } from "@nestjs/common";
import { EntryModule } from "@/entries/entries.module";
import { ExitModule } from "@/exits/exits.module";
import { PrismaService } from "@/prisma.service";
import { SpecialsController } from "./specials.controller";
import { SpecialsService } from "./specials.service";

@Module({
  imports: [EntryModule, ExitModule],
  controllers: [SpecialsController],
  providers: [SpecialsService, PrismaService],
  exports: [SpecialsService],
})
export class SpecialsModule {}
