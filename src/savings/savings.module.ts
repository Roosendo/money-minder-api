import { Module } from '@nestjs/common'
import { SavingsService } from './savings.service'
import { SavingsController } from './savings.controller'
import { UsersModule } from '@/users/users.module'
import { PrismaService } from '@/prisma.service'

@Module({
  imports: [UsersModule],
  providers: [SavingsService, PrismaService],
  controllers: [SavingsController]
})
export class SavingsModule {}
