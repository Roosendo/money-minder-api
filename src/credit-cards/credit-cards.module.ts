import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { CreditCardsController } from './credit-cards.controller'
import { CreditCardsService } from './credit-cards.service'

@Module({
  imports: [UsersModule],
  controllers: [CreditCardsController],
  providers: [CreditCardsService, PrismaService]
})
export class CreditCardsModule { }
