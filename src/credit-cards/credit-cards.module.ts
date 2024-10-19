import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'
import { Module } from '@nestjs/common'
import { CreditCardsController } from './credit-cards.controller'
import { CreditCardsService } from './credit-cards.service'

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [CreditCardsController],
  providers: [CreditCardsService]
})
export class CreditCardsModule {}
