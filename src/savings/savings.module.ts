import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { SavingsController } from "./savings.controller";
import { SavingsService } from "./savings.service";

@Module({
  controllers: [SavingsController],
  providers: [SavingsService, PrismaService],
  exports: [SavingsService],
})
export class SavingsModule {}
