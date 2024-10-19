import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EntryModule } from './entries/entries.module'
import { ExitModule } from './exits/exits.module'
import { DatabaseModule } from './config/database.module'
import configure from '@/common/configs/config'
import { PhrasesModule } from './phrases/phrases.module'
import { RemindersModule } from './reminders/reminders.module'
import { SavingsModule } from './savings/savings.module'
import { SpecialsModule } from './specials/specials.module'
import { AuthModule } from './auth/auth.module'
import { EmailModule } from './email/email.module'
import { CacheModule } from '@nestjs/cache-manager'
import { CreditCardsModule } from './credit-cards/credit-cards.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configure]
    }),
    EntryModule,
    ExitModule,
    PhrasesModule,
    RemindersModule,
    SavingsModule,
    SpecialsModule,
    DatabaseModule,
    AuthModule,
    EmailModule,
    CreditCardsModule,
    CacheModule.register({
      ttl: 60 * 1000, // seconds
      max: 100, // maximum number of items in cache
      isGlobal: true
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
