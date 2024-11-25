import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import configure from '@/common/configs/config'
import { SavingsModule } from './savings/savings.module'
import { CacheModule } from '@nestjs/cache-manager'
import { PrismaService } from './prisma.service'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { BigIntInterceptor } from './big-int-interceptor'
import { EntryModule } from './entries/entries.module'
import { ExitModule } from './exits/exits.module'
import { PhrasesModule } from './phrases/phrases.module'
import { RemindersModule } from './reminders/reminders.module'
import { AuthModule } from './auth/auth.module'
import { EmailModule } from './email/email.module'
import { SpecialsModule } from './specials/specials.module'
import { CreditCardsModule } from './credit-cards/credit-cards.module'
import { LoansModule } from './loans/loans.module'

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
    AuthModule,
    EmailModule,
    CreditCardsModule,
    LoansModule,
    CacheModule.register({
      ttl: 60 * 1000, // seconds
      max: 100, // maximum number of items in cache
      isGlobal: true
    })
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, {
    provide: APP_INTERCEPTOR,
    useClass: BigIntInterceptor
  }],
  exports: [PrismaService]
})
export class AppModule {}
