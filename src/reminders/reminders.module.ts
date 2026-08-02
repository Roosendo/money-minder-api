import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { RemindersController } from './reminders.controller'
import { RemindersService } from './reminders.service'

@Module({
  imports: [UsersModule],
  providers: [RemindersService, PrismaService],
  controllers: [RemindersController]
})
export class RemindersModule { }
