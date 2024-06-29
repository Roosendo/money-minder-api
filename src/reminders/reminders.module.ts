import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'
import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [RemindersService],
  controllers: [RemindersController]
})
export class RemindersModule {}
