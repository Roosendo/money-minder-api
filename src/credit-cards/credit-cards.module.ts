import { Module } from "@nestjs/common";
import { LedgerModule } from "@/ledger/ledger.module";
import { TransfersModule } from "@/transfers/transfers.module";
import { CreditCardsController } from "./credit-cards.controller";
import { CreditCardsService } from "./credit-cards.service";

@Module({
  imports: [LedgerModule, TransfersModule],
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
