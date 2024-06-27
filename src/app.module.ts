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
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
