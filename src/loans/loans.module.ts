import { UsersModule } from '@/users/users.module'
import { Module } from '@nestjs/common'
import { LoansController } from './loans.controller'
import { LoansService } from './loans.service'
import { PrismaService } from '@/prisma.service'

@Module({
  imports: [UsersModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService]
})
export class LoansModule {}
