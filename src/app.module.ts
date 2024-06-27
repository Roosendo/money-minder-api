import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EntryModule } from './entries/entries.module'
import { DatabaseModule } from './config/database.module'
import configure from '@/common/configs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configure]
    }),
    EntryModule,
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
