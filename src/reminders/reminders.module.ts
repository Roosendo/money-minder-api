import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'
import { DatabaseModule } from '@/config/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [RemindersService],
  controllers: [RemindersController]
})
export class RemindersModule { }
