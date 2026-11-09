import { Module } from "@nestjs/common";
import { ReportsModule } from "@/reports/reports.module";
import { TransactionsModule } from "@/transactions/transactions.module";
import { SpecialsController } from "./specials.controller";
import { SpecialsService } from "./specials.service";

@Module({
  imports: [ReportsModule, TransactionsModule],
  controllers: [SpecialsController],
  providers: [SpecialsService],
  exports: [SpecialsService],
})
export class SpecialsModule {}
