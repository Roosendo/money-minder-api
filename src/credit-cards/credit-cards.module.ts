import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreditCardsController } from "./credit-cards.controller";
import { CreditCardsService } from "./credit-cards.service";

@Module({
  controllers: [CreditCardsController],
  providers: [CreditCardsService, PrismaService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
