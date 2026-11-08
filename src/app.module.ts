import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AccountsModule } from "@/accounts/accounts.module";
import { AuthGuard } from "@/auth/auth.guard";
import { AuthModule } from "@/auth/auth.module";
import { BigIntInterceptor } from "@/big-int-interceptor";
import { CategoriesModule } from "@/categories/categories.module";
import configure from "@/common/configs/config";
import { CreditCardsModule } from "@/credit-cards/credit-cards.module";
import { EntryModule } from "@/entries/entries.module";
import { ExitModule } from "@/exits/exits.module";
import { LoansModule } from "@/loans/loans.module";
import { PhrasesModule } from "@/phrases/phrases.module";
import { PrismaService } from "@/prisma.service";
import { RemindersModule } from "@/reminders/reminders.module";
import { SavingsModule } from "@/savings/savings.module";
import { SpecialsModule } from "@/specials/specials.module";
import { UsersModule } from "@/users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configure],
    }),
    CacheModule.register({
      ttl: 60 * 1000,
      max: 200,
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    AccountsModule,
    CreditCardsModule,
    EntryModule,
    ExitModule,
    LoansModule,
    RemindersModule,
    SavingsModule,
    SpecialsModule,
    PhrasesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
