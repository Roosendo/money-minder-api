import { Module } from "@nestjs/common";
import { AccountsModule } from "@/accounts/accounts.module";
import { CategoriesModule } from "@/categories/categories.module";
import { ExitController } from "./exits.controller";
import { ExitService } from "./exits.service";

@Module({
  imports: [CategoriesModule, AccountsModule],
  controllers: [ExitController],
  providers: [ExitService],
  exports: [ExitService],
})
export class ExitModule {}
