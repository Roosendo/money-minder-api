import { Module } from "@nestjs/common";
import { LedgerModule } from "@/ledger/ledger.module";
import { TransactionsModule } from "@/transactions/transactions.module";
import { TransfersController } from "./transfers.controller";
import { TransfersService } from "./transfers.service";

@Module({
  imports: [LedgerModule, TransactionsModule],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
