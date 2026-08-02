import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { SavingsController } from './savings.controller'
import { SavingsService } from './savings.service'

@Module({
  imports: [UsersModule],
  providers: [SavingsService, PrismaService],
  controllers: [SavingsController]
})
export class SavingsModule { }
