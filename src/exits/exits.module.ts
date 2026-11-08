import { Module } from "@nestjs/common";
import { AccountsModule } from "@/accounts/accounts.module";
import { CategoriesModule } from "@/categories/categories.module";
import { PrismaService } from "@/prisma.service";
import { ExitController } from "./exits.controller";
import { ExitService } from "./exits.service";

@Module({
  imports: [CategoriesModule, AccountsModule],
  controllers: [ExitController],
  providers: [ExitService, PrismaService],
  exports: [ExitService],
})
export class ExitModule {}
