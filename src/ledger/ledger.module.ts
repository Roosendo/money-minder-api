import { Module } from "@nestjs/common";
import { BalancesService } from "./balances.service";
import { LedgerService } from "./ledger.service";
import { OwnershipService } from "./ownership.service";

@Module({
  providers: [OwnershipService, BalancesService, LedgerService],
  exports: [OwnershipService, BalancesService, LedgerService],
})
export class LedgerModule {}
