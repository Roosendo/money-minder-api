import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { LoansController } from './loans.controller'
import { LoansService } from './loans.service'

@Module({
  imports: [UsersModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService]
})
export class LoansModule { }
