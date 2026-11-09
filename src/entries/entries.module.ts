import { Module } from "@nestjs/common";
import { AccountsModule } from "@/accounts/accounts.module";
import { CategoriesModule } from "@/categories/categories.module";
import { EntryController } from "./entries.controller";
import { EntryService } from "./entries.service";

@Module({
  imports: [CategoriesModule, AccountsModule],
  controllers: [EntryController],
  providers: [EntryService],
  exports: [EntryService],
})
export class EntryModule {}
