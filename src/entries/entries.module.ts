import { Module } from "@nestjs/common";
import { CategoriesModule } from "@/categories/categories.module";
import { PrismaService } from "@/prisma.service";
import { EntryController } from "./entries.controller";
import { EntryService } from "./entries.service";

@Module({
  imports: [CategoriesModule],
  controllers: [EntryController],
  providers: [EntryService, PrismaService],
  exports: [EntryService],
})
export class EntryModule {}
