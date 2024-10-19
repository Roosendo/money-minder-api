import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'
import { Module } from '@nestjs/common'
import { LoansController } from './loans.controller'
import { LoansService } from './loans.service'

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [LoansController],
  providers: [LoansService]
})
export class LoansModule {}
