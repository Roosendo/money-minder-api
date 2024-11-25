import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'
import { UsersModule } from '@/users/users.module'
import { PrismaService } from '@/prisma.service'

@Module({
  imports: [UsersModule],
  providers: [RemindersService, PrismaService],
  controllers: [RemindersController]
})
export class RemindersModule {}
