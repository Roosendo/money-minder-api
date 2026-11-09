import { Module } from "@nestjs/common";
import { LedgerModule } from "@/ledger/ledger.module";
import { DebitCardsController } from "./debit-cards.controller";
import { DebitCardsService } from "./debit-cards.service";

@Module({
  imports: [LedgerModule],
  controllers: [DebitCardsController],
  providers: [DebitCardsService],
  exports: [DebitCardsService],
})
export class DebitCardsModule {}
